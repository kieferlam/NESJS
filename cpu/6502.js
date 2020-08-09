const FLAGS6502 = {
    C: (1 << 0),	// Carry Bit
    Z: (1 << 1),	// Zero
    I: (1 << 2),	// Disable Interrupts
    D: (1 << 3),	// Decimal Mode (unused in this implementation)
    B: (1 << 4),	// Break
    U: (1 << 5),	// Unused
    V: (1 << 6),	// Overflow
    N: (1 << 7),	// Negative
}

class cpu6502{
    constructor(){
        this.accumulator = 0x00;
        this.x = 0x00;
        this.y = 0x00;
        this.stackptr = 0x00;
        this.pc = 0x0000;
        this.status = 0x00;

        this.clock_count = 0;
        this.cycles = 0;

        this.opcode = 0;
        this.fetched = 0;
        this.addr_abs = 0;
        this.addr_rel = 0;

        this.instruction_set = new InstructionSet(this);
    }

    clock(){
        if(this.cycles == 0){
            this.opcode = this.readPcAndInc();
            this.set_flag(FLAGS6502.U, 1);

            var instruction = this.instruction_set.instructions[this.opcode];

            // Get number of cycles 
            this.cycles = instruction.cycles;

            // Fetch data
            this.cycles += instruction.fetch();
            this.cycles += instruction.execute();
            
            this.set_flag(FLAGS6502.U, 1);
        }

        this.clock_count++;

        this.cycles--;
    }

    reset(){
        // Reset registers
        this.accumulator = 0;
        this.x = 0;
        this.y = 0;
        this.stackptr = 0xFD;
        this.status = 0;

        this.addr_abs = 0xFFFC;
        var lo = this.read(this.addr_abs);
        var hi = this.read(this.addr_abs + 1);

        this.pc = (hi << 8) | lo;

        this.addr_rel = 0;
        this.addr_abs = 0;
        this.fetched = 0;

        this.cycles = 8;
    }

    interrupt_request(){
        if(!this.get_flag(FLAGS6502.I)) return;

        this.write(0x100 + this.stackptr, this.pc >> 8 & 0xFF);
        this.stackptr--;
        this.write(0x100 + this.stackptr, this.pc & 0xFF);
        this.stackptr--;

        this.set_flag(FLAGS6502.B, 0);
        this.set_flag(FLAGS6502.U, 1);
        this.set_flag(FLAGS6502.I, 1);
        this.write(0x100 + this.stackptr, this.status);
        this.stackptr--;

        this.addr_abs = 0xFFFE;
        var lo = this.cpu.read(this.addr_abs);
        var hi = this.cpu.read(this.addr_abs + 1);
        this.pc = (hi << 8) | lo;

        cycles = 7;
    }

    non_maskable_interrupt_request(){
        this.write(0x100 + this.stackptr, (this.pc >> 8) & 0xFF);
        this.stackptr--;
        this.write(0x100 + this.stackptr, this.pc & 0xFF);
        this.stackptr--;

        this.set_flag(FLAGS6502.B, 0);
        this.set_flag(FLAGS6502.U, 1);
        this.set_flag(FLAGS6502.I, 1);
        this.write(0x100 + this.stackptr, this.status);
        this.stackptr--;

        this.addr_abs = 0xFFFA;
        var lo = this.read(this.addr_abs);
        var hi = this.read(this.addr_abs + 1);
        this.pc = (hi << 8) | lo;

        this.cycles = 8;
    }

    get_flag(flag){
        return (this.status & flag) != 0;
    }

    set_flag(flag, v){
        this.status = v ? this.status | flag : this.status & ~flag;
    }

    write(addr, data){
        this.bus.write(addr, data);
    }

    read(addr){
        return this.bus.read(addr);
    }

    readPcAndInc(){
        return this.read(this.pc++);
    }

    fetch(){
        if(!(this.instruction_set.instructions[this.opcode].addr == this.instruction_set.address_modes.Implied))
            this.fetched = this.read(this.addr_abs);
        return this.fetched;
    }
}