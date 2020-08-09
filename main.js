const cpu = new cpu6502();
const bus = new Bus(cpu);

cpu.bus = bus;

var previousCell = null;

function hex(d){
    return d.toString(16).toUpperCase();
}

// Fill memory dom
for(var i = 0; i < 16; ++i){
    document.getElementById('address-column').innerHTML += `<p>$${hex(i * 0x10).padStart(4, '0')}:</p>`;
    document.getElementById('rom-address-column').innerHTML += `<p>$${hex(i * 0x10 + 0x8000).padStart(4, '0')}:</p>`;
}

function displayRAM(){
    var ramDOM = document.getElementById('ram');
    ramDOM.innerHTML = '';
    for(var i = 0; i < 16; ++i){
        for(var j = 0; j < 16; ++j){
            var cell_index = i * 16 + j;
            var byte = bus.read(cell_index);
            ramDOM.innerHTML += `<p id="ram-cell-${cell_index}" class="ram-cell">${hex(byte).padStart(2, '0')}</p>`;
        }
    }

    bus.onWrite = function(addr){
        var byte = bus.read(addr);
        var dom = document.getElementById(`ram-cell-${addr}`);
        if(!dom) return;
        dom.innerHTML = `${hex(byte).padStart(2, '0')}`;
    }
}
function displayROM(){
    var romDOM = document.getElementById('rom');
    romDOM.innerHTML = '';
    for(var i = 0; i < 16; ++i){
        for(var j = 0; j < 16; ++j){
            var cell_index = 0x8000 + i * 16 + j;
            var byte = bus.read(cell_index);
            romDOM.innerHTML += `<p id="ram-cell-${cell_index}" class="ram-cell">${hex(byte).padStart(2, '0')}</p>`;
        }
    }
}

function displayCpuStatus(){
    var statusDOM = document.getElementById('status');
    statusDOM.innerHTML = '';
    statusDOM.innerHTML += `<span class="${cpu.get_flag(FLAGS6502.N) ? 'green' : 'red'}">N</span>`;
    statusDOM.innerHTML += `<span class="${cpu.get_flag(FLAGS6502.V) ? 'green' : 'red'}">V</span>`;
    statusDOM.innerHTML += `<span class="${cpu.get_flag(FLAGS6502.U) ? 'green' : 'red'}">-</span>`;
    statusDOM.innerHTML += `<span class="${cpu.get_flag(FLAGS6502.B) ? 'green' : 'red'}">B</span>`;
    statusDOM.innerHTML += `<span class="${cpu.get_flag(FLAGS6502.D) ? 'green' : 'red'}">D</span>`;
    statusDOM.innerHTML += `<span class="${cpu.get_flag(FLAGS6502.I) ? 'green' : 'red'}">I</span>`;
    statusDOM.innerHTML += `<span class="${cpu.get_flag(FLAGS6502.Z) ? 'green' : 'red'}">Z</span>`;
    statusDOM.innerHTML += `<span class="${cpu.get_flag(FLAGS6502.C) ? 'green' : 'red'}">C</span>`;
}

function displayCpuPC(){
    var dom = document.getElementById('pc');
    dom.innerHTML = `$${hex(cpu.pc).padStart(4, '0')}`;
    var ramdom = document.getElementById(`ram-cell-${cpu.pc}`);
    if(previousCell) previousCell.classList.remove("currentPC");
    if(!ramdom) return;
    ramdom.classList.add("currentPC");
    previousCell = ramdom;
}

function displayCpuAccumulator(){
    var dom = document.getElementById('accum');
    dom.innerHTML = `$${hex(cpu.accumulator).padStart(2, '0')} [${cpu.accumulator}]`;
}
function displayCpuX(){
    var dom = document.getElementById('x-reg');
    dom.innerHTML = `$${hex(cpu.x).padStart(2, '0')} [${cpu.x}]`;
}
function displayCpuY(){
    var dom = document.getElementById('y-reg');
    dom.innerHTML = `$${hex(cpu.y).padStart(2, '0')} [${cpu.y}]`;
}
function displayCpuStackPtr(){
    var dom = document.getElementById('stackptr');
    dom.innerHTML = `$${hex(cpu.stackptr).padStart(4, '0')}`;
}
function displayCpuClock(){
    var dom = document.getElementById('clock');
    dom.innerHTML = `${cpu.clock_count}`;
}
function displayCpuCycles(){
    var dom = document.getElementById('cycles');
    dom.innerHTML = `${cpu.cycles}`;
}
function displayCpuCurrentInstruction(){
    var dom = document.getElementById('curr-ins');
    var opcode = cpu.read(cpu.pc);
    var ins = cpu.instruction_set.instructions[opcode];
    dom.innerHTML = `$${ins.op.mnemonic} {${ins.addr.name}}`;
}

function displayCpuView(){
    displayCpuStatus();
    displayCpuPC();
    displayCpuAccumulator();
    displayCpuX();
    displayCpuY();
    displayCpuStackPtr();
    displayCpuCycles();
    displayCpuClock();
    displayCpuCurrentInstruction();
}
function updateView(){
    displayCpuView();
}

displayROM();
displayRAM();
updateView();

// When clock button is pressed
function do_clock(){
    cpu.clock();
    updateView();
}

function do_reset(){
    cpu.reset();
    updateView();
}

// When LOAD button is pressed for object code
function loadObjectString(){
    var code = document.getElementById('object-string').value;
    var bytes = [];
    code.split(/[ ]+/).forEach(hex => bytes.push(parseInt(hex, 16)));
    var offset = 0x8000;
    bytes.forEach(byte => bus.ram[offset++] = byte);

    // Set reset
    bus.write(0xFFFC,0);
    bus.write(0xFFFE,0x80);

    cpu.reset();
    updateView();
    displayROM();
}