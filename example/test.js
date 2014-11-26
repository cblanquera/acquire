require('/application/foo.js', function(foo) {
	console.log(foo());
});

console.log(require('/application/bar.js')());

document.body.innerHTML = require('/application/template.html');

require('/application/circle1')();

console.log(require('/application/schema.json').foo);