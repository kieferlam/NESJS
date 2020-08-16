
class Mapper{
    constructor(prgBanks, chrBanks){
        this.prgBanks = prgBanks;
        this.chrBanks = chrBanks;
    }

    cpuMapRead(addr){

    }

    cpuMapWrite(addr){

    }

    ppuMapRead(addr){

    }

    ppuMapWrite(addr){

    }

    reset(){

    }

}

class Mapper000 extends Mapper{
    cpuMapRead(addr){
        if(addr >= 0x8000 && addr <= 0xFFFF) return addr & (this.prgBanks > 1 ? 0x7FFF : 0x3FFF);

        return false;
    }

    cpuMapWrite(addr){
        if(addr >= 0x8000 && addr <= 0xFFFF) return addr & (this.prgBanks > 1 ? 0x7FFF : 0x3FFF);

        return false;
    }

    ppuMapRead(addr){
        if(addr >= 0x8000 && addr <= 0x1FFF) return addr;

        return false;
    }

    ppuMapWrite(addr){
        //if(addr >= 0x8000 && addr <= 0x1FFF) return addr;

        return 0;
    }

    reset(){
        
    }
}