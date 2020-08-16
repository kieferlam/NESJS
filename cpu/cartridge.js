
const MIRROR = {
    INVALID: 0,
    HORIZONTAL: 1,
    VERTICAL: 2,
    ONESCREEN_LO: 3,
    ONESCREEN_HI: 4
};

class Cartridge{
    constructor(binaryString){
        var stream = new BinaryStringStream(binaryString);
        this.header = {
            name: stream.nextString(4),
            prg_rom_chunks: stream.nextByte(),
            chr_rom_chunks: stream.nextByte(),
            mapper1: stream.nextByte(),
            mapper2: stream.nextByte(),
            prg_ram_size: stream.nextByte(),
            tv_system1: stream.nextByte(),
            tv_system2: stream.nextByte()
        };
        stream.seek(5);

        if(this.header.mapper1 & 0x4) stream.seek(512); // Ignore training data

        // Mapper ID
        this.mapperID = ((this.header.mapper2 >> 4) << 4) | (this.header.mapper1 >> 4);
        
        var fileType = 1;

        if(fileType == 1){
            this.PrgBanks = this.header.prg_rom_chunks;
            this.PrgMemory = stream.nextBytes(this.PrgBanks * 16384);

            this.ChrBanks = this.header.chr_rom_chunks;
            this.ChrMemory = stream.nextBytes(this.ChrBanks * 8192);
        }

        // Load mapper
        switch(this.mapperID){
            case 0:
                this.mapper = new Mapper000(this.PrgBanks, this.ChrBanks);
                break;
        }

        this.mirror = MIRROR.HORIZONTAL;
    }

    cpuRead(addr){
        var mapped_addr = 0;
        if((mapped_addr = this.mapper.cpuMapRead(addr))){
            return this.PrgMemory[mapped_addr];
        }

        return false;
    }

    cpuWrite(addr, data){
        var mapped_addr = 0;
        if((mapped_addr = this.mapper.cpuMapRead(addr))){
            this.PrgMemory[mapped_addr] = data;
        }
    }

    ppuRead(addr){
        var mapped_addr = 0;
        if((mapped_addr = this.mapper.cpuMapRead(addr))){
            return this.ChrMemory[mapped_addr];
        }

        return false;
    }

    ppuWrite(addr, data){
        var mapped_addr = 0;
        if((mapped_addr = this.mapper.cpuMapRead(addr))){
            this.ChrMemory[mapped_addr] = data;
        }
    }

    reset(){
        if(this.mapper) this.mapper.reset();
    }
}