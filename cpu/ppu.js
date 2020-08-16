
function _make_palette() {
    var palScreen = new Array(0x40);
    palScreen[0x00] = [84, 84, 84];
    palScreen[0x01] = [0, 30, 116];
    palScreen[0x02] = [8, 16, 144];
    palScreen[0x03] = [48, 0, 136];
    palScreen[0x04] = [68, 0, 100];
    palScreen[0x05] = [92, 0, 48];
    palScreen[0x06] = [84, 4, 0];
    palScreen[0x07] = [60, 24, 0];
    palScreen[0x08] = [32, 42, 0];
    palScreen[0x09] = [8, 58, 0];
    palScreen[0x0A] = [0, 64, 0];
    palScreen[0x0B] = [0, 60, 0];
    palScreen[0x0C] = [0, 50, 60];
    palScreen[0x0D] = [0, 0, 0];
    palScreen[0x0E] = [0, 0, 0];
    palScreen[0x0F] = [0, 0, 0];

    palScreen[0x10] = [152, 150, 152];
    palScreen[0x11] = [8, 76, 196];
    palScreen[0x12] = [48, 50, 236];
    palScreen[0x13] = [92, 30, 228];
    palScreen[0x14] = [136, 20, 176];
    palScreen[0x15] = [160, 20, 100];
    palScreen[0x16] = [152, 34, 32];
    palScreen[0x17] = [120, 60, 0];
    palScreen[0x18] = [84, 90, 0];
    palScreen[0x19] = [40, 114, 0];
    palScreen[0x1A] = [8, 124, 0];
    palScreen[0x1B] = [0, 118, 40];
    palScreen[0x1C] = [0, 102, 120];
    palScreen[0x1D] = [0, 0, 0];
    palScreen[0x1E] = [0, 0, 0];
    palScreen[0x1F] = [0, 0, 0];

    palScreen[0x20] = [236, 238, 236];
    palScreen[0x21] = [76, 154, 236];
    palScreen[0x22] = [120, 124, 236];
    palScreen[0x23] = [176, 98, 236];
    palScreen[0x24] = [228, 84, 236];
    palScreen[0x25] = [236, 88, 180];
    palScreen[0x26] = [236, 106, 100];
    palScreen[0x27] = [212, 136, 32];
    palScreen[0x28] = [160, 170, 0];
    palScreen[0x29] = [116, 196, 0];
    palScreen[0x2A] = [76, 208, 32];
    palScreen[0x2B] = [56, 204, 108];
    palScreen[0x2C] = [56, 180, 204];
    palScreen[0x2D] = [60, 60, 60];
    palScreen[0x2E] = [0, 0, 0];
    palScreen[0x2F] = [0, 0, 0];

    palScreen[0x30] = [236, 238, 236];
    palScreen[0x31] = [168, 204, 236];
    palScreen[0x32] = [188, 188, 236];
    palScreen[0x33] = [212, 178, 236];
    palScreen[0x34] = [236, 174, 236];
    palScreen[0x35] = [236, 174, 212];
    palScreen[0x36] = [236, 180, 176];
    palScreen[0x37] = [228, 196, 144];
    palScreen[0x38] = [204, 210, 120];
    palScreen[0x39] = [180, 222, 120];
    palScreen[0x3A] = [168, 226, 144];
    palScreen[0x3B] = [152, 226, 180];
    palScreen[0x3C] = [160, 214, 228];
    palScreen[0x3D] = [160, 162, 160];
    palScreen[0x3E] = [0, 0, 0];
    palScreen[0x3F] = [0, 0, 0];

    return palScreen;
}

class Sprite {
    constructor(width, height, initializer = (x, y) => 0) {
        this.width = width;
        this.height = height;
        this.data = init_array(width * height, (i) => initializer(i % width, Math.floor(i / height)));
    }

    index(x, y) {
        return y * this.width + x;
    }

    get(x, y) {
        if (x < 0 || x >= this.width) return false;
        if (y < 0 || y >= this.height) return false;

        return this.inline_get(this.index(x, y));
    }

    inline_get(index) {
        return this.data[index];
    }

    set(x, y, data) {
        if (x < 0 || x >= this.width) return false;
        if (y < 0 || y >= this.height) return false;

        this.data[this.index(x, y)] = data;
    }
}

const Control = {
    nametable_x: (1 << 0),
    nametable_y: (1 << 1),
    increment_mode: (1 << 2),
    pattern_sprite: (1 << 3),
    pattern_bg: (1 << 4),
    sprite_size: (1 << 5),
    slave_mode: (1 << 6),
    enable_nmi: (1 << 7),
}

const Mask = {
    grayscale: (1 << 0),
    render_bg_left: (1 << 1),
    render_sprites_left: (1 << 2),
    render_bg: (1 << 1),
    render_sprites: (1 << 3),
    enhance_red: (1 << 4),
    enhance_green: (1 << 5),
    enhance_blue: (1 << 6),
}

class PPU {
    constructor(cpu) {
        this.cpu = cpu;
        this.nameTable = [init_array(1024), init_array(1024)];
        this.palette = init_array(32);
        this.patternTable = [init_array(4096), init_array(4096)];

        this.palScreen = _make_palette();
        this.screen = new Sprite(256, 240)
        this.spriteNameTable = [new Sprite(256, 240), new Sprite(256, 240)];
        this.spritePatternTable = [new Sprite(128, 128), new Sprite(128, 128)]

        this.scanline = 0;
        this.cycle = 0;
        this.frame_complete = false;

        this.status = {
            sprite_overflow: 0,
            sprite_zero_hit: 0,
            vertical_blank: 0,
            reg() {
                return this.sprite_overflow << 5 | this.sprite_zero_hit << 6 | this.vertical_blank << 7;
            },
            reset() {
                this.sprite_overflow = 0;
                this.sprite_zero_hit = 0;
                this.vertical_blank = 0;
            }
        };
        this.mask = 0;
        this.control = 0;
        function create_loopy_register() {
            return {
                course_x: 0,
                course_y: 0,
                nametable_x: 0,
                nametable_y: 0,
                fine_y: 0,
                reset() {
                    this.course_x = 0;
                    this.course_y = 0;
                    this.nametable_x = 0;
                    this.nametable_y = 0;
                    this.fine_y = 0;
                }
            }
        }
        this.vram_addr = create_loopy_register();
        this.tram_addr = create_loopy_register();

        this.address_latch = 0;
        this.ppu_data_buffer = 0;
        this.ppu_address = 0;

        this.fine_x = 0;

        this.bg_next_tile_id = 0x00;
        this.bg_next_tile_attrib = 0x00;
        this.bg_next_tile_lsb = 0x00;
        this.bg_next_tile_msb = 0x00;
        this.bg_shifter_pattern_lo = 0x0000;
        this.bg_shifter_pattern_hi = 0x0000;
        this.bg_shifter_attrib_lo = 0x0000;
        this.bg_shifter_attrib_hi = 0x0000;

        this.nmi = false;
    }

    reset() {
        this.cycle = 0;
        this.scanline = 0;
        this.frame_complete = false;
        this.address_latch = 0;
        this.ppu_data_buffer = 0;
        this.status.reset();
        this.mask = 0;
        this.control = 0;
        this.vram_addr.reset();
        this.tram_addr.reset();
        this.fine_x = 0;
    }

    isCurrentScreenPixel() {
        return this.cycle >= 0 && this.cycle < 256 && this.scanline >= 0 && this.scanline < 240;
    }

    getPixelColour(x, y) {
        return this.palScreen[this.screen.get(x, y)];
    }

    getCurrentCycle() {
        return this.cycle;
    }

    getCurrentScanline() {
        return this.scanline;
    }

    getCurrentColour() {
        return this.getPixelColour(this.getCurrentCycle(), this.getCurrentScanline());
    }

    getPatternTable(i, palette) {
        for (var nTileY = 0; nTileY < 16; ++nTileY) {
            for (var nTileX = 0; nTileX < 16; ++nTileX) {
                var offset = nTileY * 256 + nTileX * 16;
                for (var row = 0; row < 8; ++row) {
                    var tile_lsb = this.ppuRead(i * 0x1000 + offset + row + 0);
                    var tile_msb = this.ppuRead(i * 0x1000 + offset + row + 8);

                    for (var col = 0; col < 8; ++col) {
                        var pixel = (tile_lsb & 0x1) + (tile_msb & 0x1)
                        tile_lsb >>= 1;
                        tile_msb >>= 1;

                        this.spritePatternTable[i].set(nTileX * 8 + (7 - col), nTileY * 8 + row, pixel);
                    }
                }
            }
        }
    }

    getNameTable(i) {
        return this.spriteNameTable[i];
    }

    getColourFromPaletteRam(palette, pixel) {
        return this.palScreen[this.ppuRead(0x3F00 + (palette << 2) + pixel) & 0x3F];
    }

    cpuRead(addr) {
        var data = 0;

        switch (addr) {
            case 0x0000: // Control
                break;
            case 0x0001: // Mask
                break;
            case 0x0002: // Status
                data = (this.status.reg()) | (this.ppu_data_buffer & 0x1F);
                this.status.vertical_blank = 0;
                this.address_latch = 0;
                break;
            case 0x0003: // OAM Address
                break;
            case 0x0004: // OAM Date
                break;
            case 0x0005: // Scroll
                break;
            case 0x0006: // PPU Address
                break;
            case 0x0007: // PPU Data
                data = this.ppu_data_buffer;
                this.ppu_data_buffer = this.ppuRead(this.ppu_address);

                if (this.ppu_address > 0xF00) data = this.ppu_data_buffer;
                break;
        }

        return data;
    }

    cpuWrite(addr, data) {
        switch (addr) {
            case 0x0000: // Control
                this.control = data;
                this.tram_addr.nametable_x = this.control & Control.nametable_x;
                this.tram_addr.nametable_y = this.control & Control.nametable_y;
                break;
            case 0x0001: // Mask
                this.mask = data;
                break;
            case 0x0002: // Status
                break;
            case 0x0003: // OAM Address
                break;
            case 0x0004: // OAM Date
                break;
            case 0x0005: // Scroll
                break;
            case 0x0006: // PPU Address
                if (this.address_latch == 0) {
                    this.ppu_address = (this.ppu_address & 0xFF00) | (data << 8);
                    this.address_latch = 1;
                } else {
                    this.ppu_address = (this.ppu_address & 0xFF00) | data;
                    this.address_latch = 0;
                }
                break;
            case 0x0007: // PPU Data
                this.ppuWrite(this.ppu_address, data);
                break;
        }
    }

    ppuRead(addr) {
        var data = 0;
        addr &= 0x3FFF;

        if (this.cartridge && this.cartridge.ppuRead(addr)) {

        } else if (addr >= 0x0000 && addr < 0x2000) {
            data = this.patternTable[(addr & 0x1000) >> 12][addr & 0x0FFF];
        } else if (addr < 0x3F00) {
            addr &= 0x0FFF;

            if (this.cartridge.mirror == MIRROR.VERTICAL) {
                if (addr >= 0x0000 && addr < 0x400)
                    data = this.nameTable[0][addr & 0x3FF];
                else if (addr < 0x800)
                    data = this.nameTable[1][addr & 0x3FF];
                else if (addr < 0xC00)
                    data = this.nameTable[0][addr & 0x3FF];
                else if (addr < 0x1000)
                    data = this.nameTable[1][addr & 0x3FF];
            } else if (this.cartridge.mirror == MIRROR.HORIZONTAL) {
                if (addr >= 0x0000 && addr < 0x400)
                    data = this.nameTable[0][addr & 0x3FF];
                else if (addr < 0x800)
                    data = this.nameTable[0][addr & 0x3FF];
                else if (addr < 0xC00)
                    data = this.nameTable[1][addr & 0x3FF];
                else if (addr < 0x1000)
                    data = this.nameTable[1][addr & 0x3FF];
            }
        } else if (addr < 0x4000) {
            addr &= 0x1F;
            if (addr == 0x10) addr = 0;
            if (addr == 0x14) addr = 0x4;
            if (addr == 0x18) addr = 0x8;
            if (addr == 0x1C) addr = 0xC;
            data = this.palette[addr];
        }

        return data;
    }

    ppuWrite(addr, data) {
        addr &= 0x3FFF;

        if (this.cartridge && this.cartridge.ppuWrite(addr, data)) {

        } else if (addr >= 0x0000 && addr < 0x2000) {
            this.patternTable[(addr & 0x1000) >> 12][addr & 0x0FFF] = data;
        } else if (addr < 0x3F00) {
            addr &= 0x0FFF;

            if (this.cartridge.mirror == MIRROR.VERTICAL) {
                if (addr >= 0x0000 && addr < 0x400)
                    this.nameTable[0][addr & 0x3FF] = data;
                else if (addr < 0x800)
                    this.nameTable[1][addr & 0x3FF] = data;
                else if (addr < 0xC00)
                    this.nameTable[0][addr & 0x3FF] = data;
                else if (addr < 0x1000)
                    this.nameTable[1][addr & 0x3FF] = data;
            } else if (this.cartridge.mirror == MIRROR.HORIZONTAL) {
                if (addr >= 0x0000 && addr < 0x400)
                    this.nameTable[0][addr & 0x3FF] = data;
                else if (addr < 0x800)
                    this.nameTable[0][addr & 0x3FF] = data;
                else if (addr < 0xC00)
                    this.nameTable[1][addr & 0x3FF] = data;
                else if (addr < 0x1000)
                    this.nameTable[1][addr & 0x3FF] = data;
            }
        } else if (addr < 0x4000) {
            addr &= 0x1F;
            if (addr == 0x10) addr = 0;
            if (addr == 0x14) addr = 0x4;
            if (addr == 0x18) addr = 0x8;
            if (addr == 0x1C) addr = 0xC;
            this.palette[addr] = data;
        }
    }

    clock() {

        var incrementScrollX = () => {
            if ((this.mask & Mask.render_bg) || (this.mask & Mask.render_sprites)) {
                if (this.vram_addr.course_x == 31) {
                    this.vram_addr.course_x = 0;
                    this.vram_addr.nametable_x = ~this.vram_addr.nametable_x & 0x1;
                } else {
                    this.vram_addr.course_x++;
                }
            }
        };

        var incrementScrollY = () => {
            if ((this.mask & Mask.render_bg) || (this.mask & Mask.render_sprites)) {
                if (this.vram_addr.fine_y < 7) {
                    this.vram_addr.fine_y++;
                } else {
                    this.vram_addr.fine_y = 0;
                    if (this.vram_addr.course_y == 29) {
                        this.vram_addr.course_y = 0;
                        this.vram_addr.nametable_y = ~this.vram_addr.nametable_y & 0x1;
                    } else if (this.vram_addr.course_y == 31) {
                        this.vram_addr.course_y = 0;
                    } else {
                        this.vram_addr.course_y++;
                    }
                }
            }
        };

        var transferAddressX = () => {
            if ((this.mask & Mask.render_bg) || (this.mask & Mask.render_sprites)) {
                this.vram_addr.nametable_x = this.tram_addr.nametable_x;
                this.vram_addr.course_x = this.tram_addr.course_x;
            }
        };

        var transferAddressY = () => {
            if ((this.mask & Mask.render_bg) || (this.mask & Mask.render_sprites)) {
                this.vram_addr.fine_y = this.tram_addr.fine_y;
                this.vram_addr.nametable_y = this.tram_addr.nametable_y;
                this.vram_addr.course_y = this.tram_addr.course_y;
            }
        };

        var loadBgShifters = () => {
            this.bg_shifter_attrib_lo = (this.bg_shifter_pattern_lo & 0xFF00) | this.bg_next_tile_lsb;
            this.bg_shifter_attrib_hi = (this.bg_shifter_pattern_hi & 0xFF00) | this.bg_next_tile_msb;

            this.bg_shifter_attrib_lo = (this.bg_shifter_attrib_lo & 0xFF00) | ((this.bg_next_tile_attrib & 0b01) ? 0xFF : 0);
            this.bg_shifter_attrib_hi = (this.bg_shifter_attrib_hi & 0xFF00) | ((this.bg_next_tile_attrib & 0b10) ? 0xFF : 0);
        };

        var updateShifters = () => {
            if (this.mask & Mask.render_bg) {
                this.bg_shifter_pattern_lo <<= 1;
                this.bg_shifter_pattern_hi <<= 1;
                this.bg_shifter_attrib_lo <<= 1;
                this.bg_shifter_attrib_hi <<= 1;
            }
        };

        if (this.scanline >= -1 && this.scanline < 240) {
            if (this.scanline == 0 && this.cycle == 0) {
                this.cycle = 1;
            }

            if (this.scanline == -1 && this.cycle == 1) {
                this.status.vertical_blank = 0;
            }

            if ((this.cycle >= 2 && this.cycle < 258) || (this.cycle >= 321 && this.cycle < 338)) {
                updateShifters();

                switch ((this.cycle - 1) % 8) {
                    case 0:
                        loadBgShifters();

                        this.bg_next_tile_id = this.ppuRead(0x2000 | (this.vram_addr & 0x0FFF));
                        break;
                    case 2:
                        this.bg_next_tile_attrib = this.ppuRead(0x23C0 | (this.vram_addr.nametable_y << 11) | (this.vram_addr.nametable_x << 10) | ((this.vram_addr.course_y >> 2) << 3) | (this.vram_addr.course_x >> 2));

                        if (this.vram_addr.course_y & 0x02) this.bg_next_tile_attrib >>= 4;
                        if (this.vram_addr.course_x & 0x02) this.bg_next_tile_attrib >>= 2;
                        this.bg_next_tile_attrib &= 0x03;
                        break;
                    case 4:
                        this.bg_next_tile_lsb = this.ppuRead(((this.control & Control.pattern_bg) << 12) + (this.bg_next_tile_id << 4) + this.vram_addr.fine_y);
                        break;
                    case 6:
                        this.bg_next_tile_msb = this.ppuRead(((this.control & Control.pattern_bg) << 12) + (this.bg_next_tile_id << 4) + this.vram_addr.fine_y + 8);
                        break;
                    case 7:
                        incrementScrollX();
                        break;
                }
            }

            if(this.cycle == 256){
                incrementScrollY();
            }

            if(this.cycle == 257){
                loadBgShifters();
                transferAddressX();
            }

            if(this.cycle == 338 || this.cycle == 340){
                this.bg_next_tile_id = this.ppuRead(0x2000 | (this.vram_addr.fine_y << 12) | (this.vram_addr.nametable_y << 11) | (this.vram_addr.nametable_x << 10) | (this.vram_addr.course_y << 5) | (this.vram_addr.course_x));
            }

            if(this.scanline == -1 && this.cycle >= 280 && this.cycle < 305){
                transferAddressY();
            }
   
        }

        if(this.scanline >= 241 && this.scanline < 261){
            if(this.scanline == 241 && this.cycle == 1){
                this.status.vertical_blank = 1;
                if(this.control & Control.enable_nmi){
                    this.nmi = true;
                }
            }
        }

        var bg_pixel = 0;
        var bg_palette = 0;

        if(this.mask & Mask.render_bg){
            var bit_mux = 0x8000 >> this.fine_x;

            var p0_pixel = (this.bg_shifter_pattern_lo & bit_mux) > 0;
            var p1_pixel = (this.bg_shifter_pattern_hi & bit_mux) > 0;

            bg_pixel = (p1_pixel << 1) | p0_pixel;

            var bg_pal0 = (this.bg_shifter_attrib_lo & bit_mux) > 0;
            var bg_pal1 = (this.bg_shifter_attrib_hi & bit_mux) > 0;
            bg_palette = (bg_pal1 << 1) | bg_pal0;
        }

        this.screen.set(this.cycle - 1, this.scanline, this.getColourFromPaletteRam(bg_palette, bg_pixel));

        this.cycle++;

        if (this.cycle >= 342) {
            this.cycle = -1;
            this.scanline++;
            if (this.scanline >= 261) {
                this.scanline = -1;
                this.frame_complete = true;;
            }
        }
    }

    insertCartridge(cartridge) {
        this.cartridge = cartridge;
    }

}