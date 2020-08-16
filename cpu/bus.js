
const RAM_SIZE_IN_BYTES = 2 * 1024;

class Bus {
    constructor(cpu, ppu) {
        this.ram = new Array(RAM_SIZE_IN_BYTES);
        this.cpu = cpu;
        this.ppu = ppu;
        this.clock_count = 0;
        this.cartridge = null;

        for (var i = 0; i < RAM_SIZE_IN_BYTES; ++i) {
            this.ram[i] = 0;
        }
    }

    read(addr) {
        var data = (this.cartridge) ? this.cartridge.cpuRead(addr) : null;
        if(data != undefined && data != null && data !== false){
            return data;
        }else if (addr >= 0 && addr <= 0x1FFF) {
            return this.ram[addr & (RAM_SIZE_IN_BYTES - 1)];
        }else if(addr >= 0x2000 && addr <= 0x3FFF){
            return this.ppu.cpuRead(addr & 0x0007);
        }
    }

    write(addr, data) {
        if(this.cartridge && this.cartridge.cpuWrite(addr, data)){

        }else if (addr >= 0 && addr <= 0x1FFF) {
            this.ram[addr & (RAM_SIZE_IN_BYTES - 1)] = data;
        }else if(addr >= 0x2000 && addr <= 0x3FFF){
            this.ppu.cpuWrite(addr & 0x0007, data);
        }

        if (this.onWrite instanceof Function) this.onWrite(addr);
    }

    insertCartridge(cartridge){
        this.cartridge = cartridge;
        this.ppu.insertCartridge(cartridge);
        this.reset();
    }

    reset(){
        this.cartridge.reset();
        this.cpu.reset();
        this.ppu.reset();
        this.clock_count = 0;
    }

    clock(){
        this.ppu.clock();
        if(this.clock_count % 3 == 0) {
            this.cpu.clock();
        }

        this.clock_count++;
    }
}