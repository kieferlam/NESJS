// Make instruction struct
function _MI(address_mode, operation, cycles) {
    return { fetch: function (){ return address_mode(this);}, addr: address_mode, op: operation, cycles: cycles, execute: function(){ return this.op.func(this)}};
}

function _hi(n){
    return n & 0xFF00;
}

function _lo(n){
    return n & 0xFF;
}

function _8bit(n){
    return _lo(n);
}

class InstructionSet {
    constructor(cpu) {
        this.cpu = cpu;
        const ins = this;
        // Helper functions
        function Branch(){
            ins.cpu.cycles++;
            ins.cpu.addr_abs = ins.cpu.pc + ins.cpu.addr_rel;

            if(_hi(ins.cpu.addr_abs) != _hi(ins.cpu.pc))
                ins.cpu.cycles++;

            ins.cpu.pc = ins.cpu.addr_abs;
        }
        this.operations = {
            // Illegal instruction
            XXX: { mnemonic: "XXX", func: function (instruction) { return 0; } },
            ADC: {
                mnemonic: "ADC", func: function (instruction) {
                    ins.cpu.fetch();

                    var result = ins.cpu.accumulator + ins.cpu.fetched + ins.cpu.get_flag(FLAGS6502.C);

                    ins.cpu.set_flag(FLAGS6502.C, result > 0xFF);
                    ins.cpu.set_flag(FLAGS6502.Z, _8bit(result) == 0);
                    ins.cpu.set_flag(FLAGS6502.V, (~(ins.cpu.accumulator ^ins.cpu.fetched) & (ins.cpu.accumulator ^ result)) & 0x0080);
                    ins.cpu.set_flag(FLAGS6502.N, result & 0x80);

                    ins.cpu.accumulator = _8bit(result);

                    return 1;
                }
            },
            AND: { mnemonic: "AND", func: function (instruction) { 
                ins.cpu.fetch();

                var result = ins.cpu.accumulator & ins.cpu.fetched;

                ins.cpu.set_flag(FLAGS6502.N, result & 0x80);
                ins.cpu.set_flag(FLAGS6502.Z, _8bit(result) == 0)

                ins.cpu.accumulator = _8bit(result);

                return 0;
            } },
            ASL: { mnemonic: "ASL", func: function (instruction) { 
                ins.cpu.fetch();

                var result =ins.cpu.fetched << 1;

                ins.cpu.set_flag(FLAGS6502.C, _hi(result) > 0);
                ins.cpu.set_flag(FLAGS6502.Z, _lo(result) == 0);
                ins.cpu.set_flag(FLAGS6502.N, result & 0x80)

                if(instruction.addr == this.address_modes.Implied){
                    ins.cpu.accumulator = _8bit(result);
                }else{
                    ins.cpu.write(ins.cpu.addr_abs, _8bit(result));
                }
                return 0;
            } },
            BCC: { mnemonic: "BCC", func: function (instruction) { 
                if(!ins.cpu.get_flag(FLAGS6502.C)){
                    Branch();
                }
                return 0;
            } },
            BCS: { mnemonic: "BCS", func: function (instruction) { 
                if(ins.cpu.get_flag(FLAGS6502.C)){
                    Branch();
                }
                return 0;
            } },
            BEQ: { mnemonic: "BEQ", func: function (instruction) { 
                if(ins.cpu.get_flag(FLAGS6502.Z)){
                    Branch();
                }
                return 0;
            } },
            BIT: { mnemonic: "BIT", func: function (instruction) { 
                ins.cpu.fetch();
                var result = ins.cpu.accumulator & ins.cpu.fetched;
                ins.cpu.set_flag(FLAGS6502.Z, !_lo(result));
                ins.cpu.set_flag(FLAGS6502.N, ins.cpu.fetched & (1 << 7));
                ins.cpu.set_flag(FLAGS6502.V, ins.cpu.fetched & (1 << 6));
                return 0;
            } },
            BMI: { mnemonic: "BMI", func: function (instruction) { 
                if(ins.cpu.get_flag(FLAGS6502.N)){
                    Branch();
                }
                return 0;
            } },
            BNE: { mnemonic: "BNE", func: function (instruction) { 
                if(!ins.cpu.get_flag(FLAGS6502.Z)){
                    Branch();
                }
                return 0;
            } },
            BPL: { mnemonic: "BPL", func: function (instruction) { 
                if(!ins.cpu.get_flag(FLAGS6502.N)){
                    Branch();
                }
                return 0;
            } },
            BRK: { mnemonic: "BRK", func: function (instruction) { 
                ins.cpu.pc++;

                ins.cpu.set_flag(FLAGS6502.I, 1);
                ins.cpu.write(0x100 + ins.cpu.stackptr, _lo(ins.cpu.pc >> 8));
                ins.cpu.stackptr--;
                ins.cpu.write(0x100 + ins.cpu.stackptr, _lo(ins.cpu.pc));
                ins.cpu.stackptr--;

                ins.cpu.set_flag(FLAGS6502.B, 1);
                ins.cpu.write(0x100 + ins.cpu.stackptr, status);
                ins.cpu.stackptr--;
                ins.cpu.set_flag(FLAGS6502.B, 0);

                ins.cpu.pc = ins.cpu.read(0xFFFE) | (ins.cpu.read(0xFFFF) << 8);
                return 0;
            } },
            BVC: { mnemonic: "BVC", func: function (instruction) { 
                if(!ins.cpu.get_flag(FLAGS6502.V)){
                    Branch();
                }
                return 0;
            } },
            BVS: { mnemonic: "BVS", func: function (instruction) { 
                if(ins.cpu.get_flag(FLAGS6502.V)){
                    Branch();
                }
                return 0;
            } },
            CLC: { mnemonic: "CLC", func: function (instruction) { 
                ins.cpu.set_flag(FLAGS6502.C, 0);
                return 0;
            } },
            CLD: { mnemonic: "CLD", func: function (instruction) { 
                ins.cpu.set_flag(FLAGS6502.D, 0);
                return 0;
            } },
            CLI: { mnemonic: "CLI", func: function (instruction) { 
                ins.cpu.set_flag(FLAGS6502.I, 0);
                return 0;
            } },
            CLV: { mnemonic: "CLV", func: function (instruction) { 
                ins.cpu.set_flag(FLAGS6502.V, 0);
                return 0;
            } },
            CMP: { mnemonic: "CMP", func: function (instruction) { 
                ins.cpu.fetch();
                var result = ins.cpu.accumulator - ins.cpu.fetched;
                ins.cpu.set_flag(FLAGS6502.C, ins.cpu.accumulator > ins.cpu.fetched);
                ins.cpu.set_flag(FLAGS6502.Z, !_lo(result));
                ins.cpu.set_flag(FLAGS6502.N, result & 0x80);
                return 1;
            } },
            CPX: { mnemonic: "CPX", func: function (instruction) { 
                ins.cpu.fetch();
                var result = ins.cpu.x - ins.cpu.fetched;
                ins.cpu.set_flag(FLAGS6502.C, ins.cpu.x > ins.cpu.fetched);
                ins.cpu.set_flag(FLAGS6502.Z, !_lo(result));
                ins.cpu.set_flag(FLAGS6502.N, result & 0x80);
                return 0;
            } },
            CPY: { mnemonic: "CPY", func: function (instruction) { 
                ins.cpu.fetch();
                var result = ins.cpu.y - ins.cpu.fetched;
                ins.cpu.set_flag(FLAGS6502.C, ins.cpu.y > ins.cpu.fetched);
                ins.cpu.set_flag(FLAGS6502.Z, !_lo(result));
                ins.cpu.set_flag(FLAGS6502.N, result & 0x80);
                return 0;
            } },
            DEC: { mnemonic: "DEC", func: function (instruction) { 
                ins.cpu.fetch();
                var result = ins.cpu.fetched - 1;
                if(result < 0) result = 0xFF;
                ins.cpu.write(ins.cpu.addr_abs, _8bit(result));
                ins.cpu.set_flag(FLAGS6502.Z, !_8bit(result));
                ins.cpu.set_flag(FLAGS6502.N, result & 0x80);
                return 0;
            } },
            DEX: { mnemonic: "DEX", func: function (instruction) { 
                ins.cpu.x--;
                if(ins.cpu.x < 0) ins.cpu.x = 0xFF;
                ins.cpu.set_flag(FLAGS6502.Z, ins.cpu.x == 0);
                ins.cpu.set_flag(FLAGS6502.N, ins.cpu.x & 0x80);
                return 0;
            } },
            DEY: { mnemonic: "DEY", func: function (instruction) { 
                ins.cpu.y--;
                if(ins.cpu.y < 0) ins.cpu.y = 0xFF;
                ins.cpu.set_flag(FLAGS6502.Z, ins.cpu.y == 0);
                ins.cpu.set_flag(FLAGS6502.N, ins.cpu.y & 0x80);
                return 0;
            } },
            EOR: { mnemonic: "EOR", func: function (instruction) { 
                ins.cpu.fetch();
                ins.cpu.accumulator = ins.cpu.accumulator ^ ins.cpu.fetched;
                ins.cpu.set_flag(FLAGS6502.Z, ins.cpu.accumulator == 0);
                ins.cpu.set_flag(FLAGS6502.N, ins.cpu.accumulator & 0x80);
                return 0;
            } },
            INC: { mnemonic: "INC", func: function (instruction) { 
                ins.cpu.fetch();
                var result = ins.cpu.fetched + 1;
                ins.cpu.write(ins.cpu.addr_abs, _8bit(result));
                ins.cpu.set_flag(FLAGS6502.Z, !_lo(result));
                ins.cpu.set_flag(FLAGS6502.N, result & 0x80);
                return 0;
            } },
            INX: { mnemonic: "INX", func: function (instruction) { 
                ins.cpu.x++;
                ins.cpu.set_flag(FLAGS6502.Z, !ins.cpu.x);
                ins.cpu.set_flag(FLAGS6502.N, ins.cpu.x & 0x80);
                return 0;
            } },
            INY: { mnemonic: "INY", func: function (instruction) { 
                ins.cpu.y++;
                ins.cpu.set_flag(FLAGS6502.Z, !ins.cpu.y);
                ins.cpu.set_flag(FLAGS6502.N, ins.cpu.y & 0x80);
                return 0;
            } },
            JMP: { mnemonic: "JMP", func: function (instruction) { 
                ins.cpu.pc =ins.cpu.addr_abs;
                return 0;
            } },
            JSR: { mnemonic: "JSR", func: function (instruction) { 
                ins.cpu.pc--;
                ins.cpu.write(0x100 + ins.cpu.stackptr, _lo(ins.cpu.pc >> 8));
                ins.cpu.stackptr--;
                ins.cpu.write(0x100 + ins.cpu.stackptr, ins.cpu.pc);
                ins.cpu.stackptr--;

                ins.cpu.pc = ins.cpu.addr_abs;
                return 0;
            } },
            LDA: { mnemonic: "LDA", func: function (instruction) { 
                ins.cpu.fetch();
                ins.cpu.accumulator =ins.cpu.fetched;
                ins.cpu.set_flag(FLAGS6502.Z, !ins.cpu.accumulator);
                ins.cpu.set_flag(FLAGS6502.N, ins.cpu.accumulator & 0x80);
                return 1;
            } },
            LDX: { mnemonic: "LDX", func: function (instruction) { 
                ins.cpu.fetch();
                ins.cpu.x =ins.cpu.fetched;
                ins.cpu.set_flag(FLAGS6502.Z, !ins.cpu.x);
                ins.cpu.set_flag(FLAGS6502.N, ins.cpu.x & 0x80);
                return 1;
            } },
            LDY: { mnemonic: "LDY", func: function (instruction) { 
                ins.cpu.fetch();
                ins.cpu.y =ins.cpu.fetched;
                ins.cpu.set_flag(FLAGS6502.Z, !ins.cpu.y);
                ins.cpu.set_flag(FLAGS6502.N, ins.cpu.y & 0x80);
                return 1;
            } },
            LSR: { mnemonic: "LSR", func: function (instruction) { 
                ins.cpu.fetch();
                ins.cpu.set_flag(FLAGS6502.C, ins.cpu.fetched & 0x1);

                var result =ins.cpu.fetched >> 1;

                ins.cpu.set_flag(FLAGS6502.Z, _lo(result) == 0);
                ins.cpu.set_flag(FLAGS6502.N, result & 0x80)

                if(instruction.addr == this.address_modes.Implied){
                    ins.cpu.accumulator = _8bit(result);
                }else{
                    ins.cpu.write(ins.cpu.addr_abs, _8bit(result));
                }
                return 0;
            } },
            NOP: { mnemonic: "NOP", func: function (instruction) { 
                // No Operation
                return 0;
            } },
            ORA: { mnemonic: "ORA", func: function (instruction) { 
                ins.cpu.fetch();

                var result = ins.cpu.accumulator | ins.cpu.fetched;
                ins.cpu.set_flag(FLAGS6502.Z, !_8bit(result));
                ins.cpu.set_flag(FLAGS6502.N, result & 0x80);

                ins.cpu.accumulator = _8bit(result);

                return 0;
            } },
            PHA: { mnemonic: "PHA", func: function (instruction) { 
                ins.cpu.write(0x100 + ins.cpu.stackptr, ins.cpu.accumulator);
                ins.cpu.stackptr--;
                return 0;
            } },
            PHP: { mnemonic: "PHP", func: function (instruction) { 
                ins.cpu.write(0x100 + ins.cpu.stackptr, ins.cpu.status | FLAGS6502.B | FLAGS6502.U);
                ins.cpu.set_flag(FLAGS6502.B, 0);
                ins.cpu.set_flag(FLAGS6502.U, 0);
                ins.cpu.stackptr--;
                return 0;
            } },
            PLA: { mnemonic: "PLA", func: function (instruction) { 
                ins.cpu.stackptr++;
                ins.cpu.accumulator = ins.cpu.read(0x100 + ins.cpu.stackptr);
                ins.cpu.set_flag(FLAGS6502.Z, !ins.cpu.accumulator);
                ins.cpu.set_flag(FLAGS6502.N, ins.cpu.accumulator & 0x80);
                return 0;
            } },
            PLP: { mnemonic: "PLP", func: function (instruction) { 
                ins.cpu.stackptr++;
                ins.cpu.status = ins.cpu.read(0x100 + ins.cpu.stackptr);
                ins.cpu.set_flag(FLAGS6502.U, 1);
                return 0;
            } },
            ROL: { mnemonic: "ROL", func: function (instruction) { 
                ins.cpu.fetch();

                var result = (fetched << 1) | ins.cpu.get_flag(FLAGS6502.C);
                ins.cpu.set_flag(FLAGS6502.C, _hi(result));
                ins.cpu.set_flag(FLAGS6502.Z, !_lo(result));
                ins.cpu.set_flag(FLAGS6502.N, result & 0x80);
                
                if(instruction.addr == this.address_modes.Implied){
                    ins.cpu.accumulator = _8bit(result);
                }else{
                    ins.cpu.write(ins.cpu.addr_abs, _8bit(result));
                }
                
                return 0;
            } },
            ROR: { mnemonic: "ROR", func: function (instruction) { 
                ins.cpu.fetch();

                var result = (ins.cpu.get_flag(FLAGS6502.C) << 7) | (fetched >> 1);
                ins.cpu.set_flag(FLAGS6502.C,ins.cpu.fetched & 0x1);
                ins.cpu.set_flag(FLAGS6502.Z, !_lo(result));
                ins.cpu.set_flag(FLAGS6502.N, result & 0x80);

                if(instruction.addr == this.address_modes.Implied){
                    ins.cpu.accumulator = _8bit(result);
                }else{
                    ins.cpu.write(ins.cpu.addr_abs, _8bit(result));
                }
                return 0;
            } },
            RTI: { mnemonic: "RTI", func: function (instruction) { 
                // Read status register from stack
                ins.cpu.stackptr++;
                ins.cpu.status = ins.cpu.read(0x100 + ins.cpu.stackptr);
                ins.cpu.status &= ~FLAGS6502.B; // Unset flags
                ins.cpu.status &= ~FLAGS6502.U;

                // Read pc from stack (pc is 16 bit so we need 2 reads)
                ins.cpu.stackptr++;
                ins.cpu.pc = ins.cpu.read(0x100 + ins.cpu.stackptr);
                ins.cpu.stackptr++;
                ins.cpu.pc |= ins.cpu.read(0x100 + ins.cpu.stackptr) << 8;
                return 0;
            } },
            RTS: { mnemonic: "RTS", func: function (instruction) { 
                ins.cpu.stackptr++;
                ins.cpu.pc = ins.cpu.read(0x100 + ins.cpu.stackptr);
                ins.cpu.stackptr++;
                ins.cpu.pc |= ins.cpu.read(0x100 + ins.cpu.stackptr) << 8;

                ins.cpu.pc++;
                return 0;
            } },
            SBC: { mnemonic: "SBC", func: function (instruction) { 
                ins.cpu.fetch();

                var value = ins.cpu.fetched ^ 0xFF;

                var result = ins.cpu.accumulator + value + ins.cpu.get_flag(FLAGS6502.C);
                ins.cpu.set_flag(FLAGS6502.C, result & 0xFF00);
                ins.cpu.set_flag(FLAGS6502.Z, !_lo(result));
                ins.cpu.set_flag(FLAGS6502.V, (result ^ ins.cpu.accumulator) & (result ^ value) & 0x80);
                ins.cpu.set_flag(FLAGS6502.N, result & 0x80);
                ins.cpu.accumulator = _8bit(result);
                return 0;
            } },
            SEC: { mnemonic: "SEC", func: function (instruction) { 
                ins.cpu.set_flag(FLAGS6502.C, 1);
                return 0;
            } },
            SED: { mnemonic: "SED", func: function (instruction) { 
                ins.cpu.set_flag(FLAGS6502.D, 1);
                return 0;
            } },
            SEI: { mnemonic: "SEI", func: function (instruction) { 
                ins.cpu.set_flag(FLAGS6502.I, 1);
                return 0;
            } },
            STA: { mnemonic: "STA", func: function (instruction) { 
                ins.cpu.write(ins.cpu.addr_abs, ins.cpu.accumulator);
                return 0;
            } },
            STX: { mnemonic: "STX", func: function (instruction) { 
                ins.cpu.write(ins.cpu.addr_abs, ins.cpu.x);
                return 0;
            } },
            STY: { mnemonic: "STY", func: function (instruction) { 
                ins.cpu.write(ins.cpu.addr_abs, ins.cpu.y);
                return 0;
            } },
            TAX: { mnemonic: "TAX", func: function (instruction) { 
                ins.cpu.x = ins.cpu.accumulator;

                ins.cpu.set_flag(FLAGS6502.Z, !ins.cpu.x);
                ins.cpu.set_flag(FLAGS6502.N, ins.cpu.x & 0x80);
                return 0;
            } },
            TAY: { mnemonic: "TAY", func: function (instruction) { 
                ins.cpu.y = ins.cpu.accumulator;

                ins.cpu.set_flag(FLAGS6502.Z, !ins.cpu.y);
                ins.cpu.set_flag(FLAGS6502.N, ins.cpu.y & 0x80);
                return 0;
            } },
            TSX: { mnemonic: "TSX", func: function (instruction) { 
                ins.cpu.x = ins.cpu.stackptr;
                ins.cpu.set_flag(FLAGS6502.Z, !_lo(ins.cpu.x));
                ins.cpu.set_flag(FLAGS6502.N, ins.cpu.x & 0x80);
                return 0;
            } },
            TXA: { mnemonic: "TXA", func: function (instruction) { 
                ins.cpu.accumulator = ins.cpu.x;
                ins.cpu.set_flag(FLAGS6502.Z, !_lo(ins.cpu.accumulator));
                ins.cpu.set_flag(FLAGS6502.N, ins.cpu.accumulator & 0x80);
                return 0;
            } },
            TXS: { mnemonic: "TXS", func: function (instruction) { 
                ins.cpu.stackptr = ins.cpu.x;
                return 0;
            } },
            TYA: { mnemonic: "TYA", func: function (instruction) { 
                ins.cpu.accumulator = ins.cpu.y;
                ins.cpu.set_flag(FLAGS6502.Z, !_lo(ins.cpu.accumulator));
                ins.cpu.set_flag(FLAGS6502.N, ins.cpu.accumulator & 0x80);
                return 0;
            } },
        };
        this.address_modes = {
            Accum(instruction) { ins.cpu.fetched = ins.cpu.accumulator; return 0; },
            IMM(instruction) { ins.cpu.addr_abs = ins.cpu.pc++; return 0; },
            Absolute(instruction) { 
                var lo = ins.cpu.readPcAndInc(); 
                var hi = ins.cpu.readPcAndInc(); 
                ins.cpu.addr_abs = (hi << 8) | lo; 
                return 0; 
            },
            ZP(instruction) { 
                ins.cpu.addr_abs = ins.cpu.readPcAndInc(); 
                ins.cpu.addr_abs &= 0xFF; 
                return 0; 
            },
            ZPX(instruction) { ins.cpu.addr_abs = (ins.cpu.read(ins.cpu.pc) + ins.cpu.x); return 0; },
            ZPY(instruction) { ins.cpu.addr_abs = (ins.cpu.read(ins.cpu.pc) + ins.cpu.x); return 0; },
            ABSX(instruction) {
                var lo = ins.cpu.readPcAndInc();
                var hi = ins.cpu.readPcAndInc();
                ins.cpu.addr_abs = (hi << 8) | lo;
                ins.cpu.addr_abs += ins.cpu.x;
                return ((ins.cpu.addr_abs & 0xFF00) != (hi << 8));
            },
            ABSY(instruction) {
                var lo = ins.cpu.readPcAndInc();
                var hi = ins.cpu.readPcAndInc();
                ins.cpu.addr_abs = (hi << 8) | lo;
                ins.cpu.addr_abs += ins.cpu.y;
                return ((ins.cpu.addr_abs & 0xFF00) != (hi << 8));
            },
            Implied(instruction) {
                ins.cpu.fetched = ins.cpu.accumulator;
                return 0;
            },
            Relative(instruction) {
                ins.cpu.addr_rel = ins.cpu.readPcAndInc();
                if (ins.cpu.addr_rel & 0x80) ins.cpu.addr_rel = ins.cpu.addr_rel | 0xFFFFFF00; 
                return 0;
            },
            INDX(instruction) {
                var t = ins.cpu.readPcAndInc();
                var lo = ins.cpu.read((t + ins.cpu.x) & 0xFF);
                var hi = ins.cpu.read((t + ins.cpu.x + 1) & 0xFF);
               ins.cpu.addr_abs = (hi << 8) | lo;
                return 0;
            },
            INDY(instruction) {
                var t = ins.cpu.readPcAndInc();
                var lo = ins.cpu.read((t + ins.cpu.y) & 0xFF);
                var hi = ins.cpu.read((t + ins.cpu.y + 1) & 0xFF);
               ins.cpu.addr_abs = (hi << 8) | lo;
                return 0;
            },
            Indirect(instruction) {
                var ptr_lo = ins.cpu.readPcAndInc();
                var ptr_hi = ins.cpu.readPcAndInc();

                var ptr = (ptr_hi << 8) | ptr_lo;
                if (ptr == 0xFF)ins.cpu.addr_abs = (ins.cpu.read(ptr & 0xFF) << 8) | ins.cpu.read(ptr + 0); // this is a hardware bug that is implemented for simulation accuracy
                else ins.cpu.addr_abs = (ins.cpu.read(ptr + 1) << 8) | ins.cpu.read(ptr + 0)
            },
        };
        const ILLEGAL_INSTRUCTION = _MI(this.address_modes.Implied, this.operations.XXX, 0);
        this.instructions = [
            _MI(this.address_modes.Implied, this.operations.BRK, 7),
            _MI(this.address_modes.INDX, this.operations.ORA, 6),
            ILLEGAL_INSTRUCTION, ILLEGAL_INSTRUCTION, ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.ZP, this.operations.ORA, 3),
            _MI(this.address_modes.ZP, this.operations.ASL, 5),
            ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.Implied, this.operations.PHP, 3),
            _MI(this.address_modes.IMM, this.operations.ORA, 2),
            _MI(this.address_modes.Accum, this.operations.ASL, 2),
            ILLEGAL_INSTRUCTION, ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.Absolute, this.operations.ORA, 4),
            _MI(this.address_modes.Absolute, this.operations.ASL, 6),
            ILLEGAL_INSTRUCTION,    // 0F
            _MI(this.address_modes.Relative, this.operations.BPL, 2),
            _MI(this.address_modes.INDY, this.operations.ORA, 5),
            ILLEGAL_INSTRUCTION, ILLEGAL_INSTRUCTION, ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.ZPX, this.operations.ORA, 4),
            _MI(this.address_modes.ZPX, this.operations.ASL, 6),
            ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.Implied, this.operations.CLC, 2),
            _MI(this.address_modes.ABSY, this.operations.ORA, 4),
            ILLEGAL_INSTRUCTION, ILLEGAL_INSTRUCTION, ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.ABSX, this.operations.ORA, 4),
            _MI(this.address_modes.ABSX, this.operations.ASL, 7),
            ILLEGAL_INSTRUCTION,    // 1F
            _MI(this.address_modes.Absolute, this.operations.JSR, 6),
            _MI(this.address_modes.INDX, this.operations.AND, 6),
            ILLEGAL_INSTRUCTION, ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.ZP, this.operations.BIT, 3),
            _MI(this.address_modes.ZP, this.operations.AND, 3),
            _MI(this.address_modes.ZP, this.operations.ROL, 5),
            ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.Implied, this.operations.PLP, 4),
            _MI(this.address_modes.IMM, this.operations.AND, 2),
            _MI(this.address_modes.Accum, this.operations.ROL, 2),
            ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.Absolute, this.operations.BIT, 4),
            _MI(this.address_modes.Absolute, this.operations.AND, 4),
            _MI(this.address_modes.Absolute, this.operations.ROL, 6),
            ILLEGAL_INSTRUCTION,   // 2F
            _MI(this.address_modes.Relative, this.operations.BMI, 2),
            _MI(this.address_modes.INDY, this.operations.AND, 5),
            ILLEGAL_INSTRUCTION, ILLEGAL_INSTRUCTION, ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.ZPX, this.operations.AND, 4),
            _MI(this.address_modes.ZPX, this.operations.ROL, 6),
            ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.Implied, this.operations.SEC, 2),
            _MI(this.address_modes.ABSY, this.operations.AND, 4),
            ILLEGAL_INSTRUCTION, ILLEGAL_INSTRUCTION, ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.ABSX, this.operations.AND, 4),
            _MI(this.address_modes.ABSX, this.operations.ROL, 7),
            ILLEGAL_INSTRUCTION,   // 3F
            _MI(this.address_modes.Implied, this.operations.RTI, 6),
            _MI(this.address_modes.INDX, this.operations.EOR, 6),
            ILLEGAL_INSTRUCTION, ILLEGAL_INSTRUCTION, ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.ZP, this.operations.EOR, 3),
            _MI(this.address_modes.ZP, this.operations.LSR, 5),
            ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.Implied, this.operations.PHA, 3),
            _MI(this.address_modes.IMM, this.operations.EOR, 2),
            _MI(this.address_modes.Accum, this.operations.LSR, 2),
            ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.ABS, this.operations.JMP, 3),
            _MI(this.address_modes.ABS, this.operations.EOR, 4),
            _MI(this.address_modes.ABS, this.operations.LSR, 6),
            ILLEGAL_INSTRUCTION,   // 4F
            _MI(this.address_modes.Relative, this.operations.BVC, 2),
            _MI(this.address_modes.INDY, this.operations.EOR, 2),
            ILLEGAL_INSTRUCTION, ILLEGAL_INSTRUCTION, ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.ZPX, this.operations.EOR, 4),
            _MI(this.address_modes.ZPX, this.operations.LSR, 6),
            ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.Implied, this.operations.CLI, 2),
            _MI(this.address_modes.ABSY, this.operations.EOR, 4),
            ILLEGAL_INSTRUCTION, ILLEGAL_INSTRUCTION, ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.ABSX, this.operations.EOR, 4),
            _MI(this.address_modes.ABSX, this.operations.LSR, 7),
            ILLEGAL_INSTRUCTION,   // 5F
            _MI(this.address_modes.Implied, this.operations.RTS, 6),
            _MI(this.address_modes.INDX, this.operations.ADC, 6),
            ILLEGAL_INSTRUCTION, ILLEGAL_INSTRUCTION, ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.ZP, this.operations.ADC, 3),
            _MI(this.address_modes.ZP, this.operations.ROR, 5),
            ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.Implied, this.operations.PLA, 4),
            _MI(this.address_modes.IMM, this.operations.ADC, 2),
            _MI(this.address_modes.Accum, this.operations.ROR, 2),
            ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.Indirect, this.operations.JMP, 5),
            _MI(this.address_modes.Absolute, this.operations.ADC, 4),
            _MI(this.address_modes.Absolute, this.operations.ROR, 6),
            ILLEGAL_INSTRUCTION,   // 6F
            _MI(this.address_modes.Relative, this.operations.BVS, 2),
            _MI(this.address_modes.INDY, this.operations.ADC, 5),
            ILLEGAL_INSTRUCTION, ILLEGAL_INSTRUCTION, ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.ZPX, this.operations.ADC, 4),
            _MI(this.address_modes.ZPX, this.operations.ROR, 6),
            ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.Implied, this.operations.SEI, 2),
            _MI(this.address_modes.ABSY, this.operations.ADC, 4),
            ILLEGAL_INSTRUCTION, ILLEGAL_INSTRUCTION, ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.ABSX, this.operations.ADC, 4),
            _MI(this.address_modes.ABSX, this.operations.ROR, 7),
            ILLEGAL_INSTRUCTION,   // 7F
            ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.INDX, this.operations.STA, 6),
            ILLEGAL_INSTRUCTION, ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.ZP, this.operations.STY, 3),
            _MI(this.address_modes.ZP, this.operations.STA, 3),
            _MI(this.address_modes.ZP, this.operations.STX, 3),
            ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.Implied, this.operations.DEY, 2),
            ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.Implied, this.operations.TXA, 2),
            ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.Absolute, this.operations.STY, 4),
            _MI(this.address_modes.Absolute, this.operations.STA, 4),
            _MI(this.address_modes.Absolute, this.operations.STX, 4),
            ILLEGAL_INSTRUCTION,   // 8F
            _MI(this.address_modes.Relative, this.operations.BCC, 2),
            _MI(this.address_modes.INDY, this.operations.STA, 6),
            ILLEGAL_INSTRUCTION, ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.ZPX, this.operations.STY, 4),
            _MI(this.address_modes.ZPX, this.operations.STA, 4),
            _MI(this.address_modes.ZPX, this.operations.STX, 4),
            ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.Implied, this.operations.TYA, 2),
            _MI(this.address_modes.ABSY, this.operations.STA, 5),
            _MI(this.address_modes.Implied, this.operations.TXS, 2),
            ILLEGAL_INSTRUCTION, ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.ABSX, this.operations.STA, 5),
            ILLEGAL_INSTRUCTION, ILLEGAL_INSTRUCTION,   // 9F
            _MI(this.address_modes.IMM, this.operations.LDY, 2),
            _MI(this.address_modes.INDX, this.operations.LDA, 6),
            _MI(this.address_modes.IMM, this.operations.LDX, 2),
            ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.ZP, this.operations.LDY, 3),
            _MI(this.address_modes.ZP, this.operations.LDA, 3),
            _MI(this.address_modes.ZP, this.operations.LDX, 3),
            ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.Implied, this.operations.TAY, 2),
            _MI(this.address_modes.IMM, this.operations.LDA, 2),
            _MI(this.address_modes.Implied, this.operations.TAX, 2),
            ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.Absolute, this.operations.LDY, 4),
            _MI(this.address_modes.Absolute, this.operations.LDA, 4),
            _MI(this.address_modes.Absolute, this.operations.LDX, 4),
            ILLEGAL_INSTRUCTION,   // AF
            _MI(this.address_modes.Relative, this.operations.BCS, 2),
            _MI(this.address_modes.INDY, this.operations.LDA, 5),
            ILLEGAL_INSTRUCTION, ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.ZPX, this.operations.LDY, 4),
            _MI(this.address_modes.ZPX, this.operations.LDA, 4),
            _MI(this.address_modes.ZPY, this.operations.LDX, 4),
            ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.Implied, this.operations.CLV, 2),
            _MI(this.address_modes.ABSY, this.operations.LDA, 4),
            _MI(this.address_modes.Implied, this.operations.TSX, 2),
            ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.ABSX, this.operations.LDY, 4),
            _MI(this.address_modes.ABSX, this.operations.LDA, 4),
            _MI(this.address_modes.ABSY, this.operations.LDX, 4),
            ILLEGAL_INSTRUCTION,   // BF
            _MI(this.address_modes.IMM, this.operations.CPY, 2),
            _MI(this.address_modes.INDX, this.operations.CMP, 6),
            ILLEGAL_INSTRUCTION, ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.ZP, this.operations.CPY, 3),
            _MI(this.address_modes.ZP, this.operations.CMP, 3),
            _MI(this.address_modes.ZP, this.operations.DEC, 5),
            ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.Implied, this.operations.INY, 2),
            _MI(this.address_modes.IMM, this.operations.CMP, 2),
            _MI(this.address_modes.Implied, this.operations.DEX, 2),
            ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.Absolute, this.operations.CPY, 4),
            _MI(this.address_modes.Absolute, this.operations.CMP, 4),
            _MI(this.address_modes.Absolute, this.operations.DEC, 6),
            ILLEGAL_INSTRUCTION,   // CF
            _MI(this.address_modes.Relative, this.operations.BNE, 2),
            _MI(this.address_modes.INDY, this.operations.CMP, 5),
            ILLEGAL_INSTRUCTION, ILLEGAL_INSTRUCTION, ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.ZPX, this.operations.CMP, 4),
            _MI(this.address_modes.ZPX, this.operations.DEC, 6),
            ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.Implied, this.operations.CLD, 2),
            _MI(this.address_modes.ABSY, this.operations.CMP, 4),
            ILLEGAL_INSTRUCTION, ILLEGAL_INSTRUCTION, ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.ABSX, this.operations.CMP, 4),
            _MI(this.address_modes.ABSX, this.operations.DEC, 7),
            ILLEGAL_INSTRUCTION,   // DF
            _MI(this.address_modes.IMM, this.operations.CPX, 2),
            _MI(this.address_modes.INDX, this.operations.SBC, 6),
            ILLEGAL_INSTRUCTION, ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.ZP, this.operations.CPX, 3),
            _MI(this.address_modes.ZP, this.operations.SBC, 3),
            _MI(this.address_modes.ZP, this.operations.INC, 5),
            ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.Implied, this.operations.INX, 2),
            _MI(this.address_modes.IMM, this.operations.SBC, 2),
            _MI(this.address_modes.Implied, this.operations.NOP, 2),
            ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.Absolute, this.operations.CPX, 4),
            _MI(this.address_modes.Absolute, this.operations.SBC, 4),
            _MI(this.address_modes.Absolute, this.operations.INC, 6),
            ILLEGAL_INSTRUCTION,   // EF
            _MI(this.address_modes.Relative, this.operations.BEQ, 2),
            _MI(this.address_modes.INDY, this.operations.SBC, 5),
            ILLEGAL_INSTRUCTION, ILLEGAL_INSTRUCTION, ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.ZPX, this.operations.SBC, 4),
            _MI(this.address_modes.ZPX, this.operations.INC, 6),
            ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.Implied, this.operations.SED, 2),
            _MI(this.address_modes.ABSY, this.operations.SBC, 4),
            ILLEGAL_INSTRUCTION, ILLEGAL_INSTRUCTION, ILLEGAL_INSTRUCTION,
            _MI(this.address_modes.ABSX, this.operations.SBC, 4),
            _MI(this.address_modes.ABSX, this.operations.INC, 7),
            ILLEGAL_INSTRUCTION,   // FF
        ];
    }
}