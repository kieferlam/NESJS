class BinaryStringStream{
    constructor(binaryString, offset = 0, limit = 0){
        this.data = binaryString;
        this.head = offset;
        this.limit = limit > 0 ? limit : binaryString.length;
        this.offset = offset;
    }

    nextString(length){
        if(!this.hasNext(length)){
            console.error('Next string will read beyond limit.');
            return null;
        }
        var val = this.data.substring(this.head, length);
        this.head += length;
        return val;
    }

    nextByte(){
        if(!this.hasNext()){
            console.error('Next byte will read beyond limit.');
            return 0;
        }
        return this.data.charCodeAt(this.head++);
    }

    nextBytes(length){
        if(!this.hasNext(length)){
            console.error(`Reading ${length} bytes will reach beyond limit.`);
            return [];
        }
        var bytes = [];
        for(var i = 0; i < length && this.hasNext(); ++i){
            bytes.push(this.nextByte());
        }
        return bytes;
    }

    hasNext(length = 0){
        return this.head + (length - 1) < this.limit;
    }

    seek(length){
        this.head += length;
    }

    peekByte(){
        return this.data.charCodeAt(this.head);
    }

    reset(){
        this.head = this.offset;
    }
}