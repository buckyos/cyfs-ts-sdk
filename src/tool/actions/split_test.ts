
var str = 'dump "OOD    wqwdq.txt" -s e:'

var regex = /"([^"]*)"|(\S+)/g;
var result = (str.match(regex) || []).map(m => m.replace(regex, '$1$2'));

console.log(result);
