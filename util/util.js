
function init_array(length, initializer = (_) => 0){
    return Array.from({length: length}, (_, i) => initializer(i))
}