
const RAM_SIZE_IN_BYTES = 64 * 1024;

class Bus{
    constructor(cpu){
        this.ram = new Array(RAM_SIZE_IN_BYTES);
        this.cpu = cpu;

        for(var i = 0; i < RAM_SIZE_IN_BYTES; ++i){
            this.ram[i] = 0;
        }
    }

    read(addr){
        if(addr < 0 || addr > RAM_SIZE_IN_BYTES) return 0;
        return this.ram[addr];
    }

    write(addr, data){
        if(addr < 0 || addr > RAM_SIZE_IN_BYTES) return;
        this.ram[addr] = data;
        if(this.onWrite instanceof Function) this.onWrite(addr);
    }
}