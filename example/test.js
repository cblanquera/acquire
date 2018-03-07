require('/application/foo.js', function(foo) {
    console.log(foo());
});

console.log(require('/application/bar.js')());

document.body.innerHTML = require('/application/template.html');

require('/application/circle1')();

console.log(require('/application/schema.json').foo);

require([
    '/application/foo.js',
    '/application/bar.js',
    '/application/template.html',
    '/application/schema.json'],
    function(foo, bar, template, schema) {
        console.log('----Mass Require 2----');
        console.log(foo());
        console.log(bar());
        console.log(template);
        console.log(schema.bar);
    });
