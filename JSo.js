/*var jsonString = "{\"key\":\"value\"}";
var jsonObj = JSON.parse(jsonString);
console.log(jsonObj.key);

var jsonObj2 = {'key':'value'};
console.log(JSON.stringify(jsonObj2));

function MyClass(){
this.a = 'some value';
this.b = {
  'key': 'another json structure'
};
}
 
var instance = new MyClass();
var instanceJSON = JSON.stringify(instance);
console.log(instanceJSON);
console.log(instance.a);

var instance2 = new function() { this.a = 'some value too';this.b = {'key' : 'another json struture too'}};
console.log(instance2.a);
console.log(instance2.b.key);


var myJson = {'key':'value', 'key2':'value2'};
for(var myKey in myJson) {
   console.log("key:"+myKey+", value:"+myJson[myKey]);
}*/

var Bouteilles = {};
//var Bouteille1 = new function () {this.name = "toto";this.millesime = '2011';};
var Bouteille2 = new function () {this.name = "titi";this.millesime = '2012';};

Bouteilles[1] = new function () {this.name = "toto";this.millesime = '2011';};
Bouteilles[2] = Bouteille2;

console.log ('Bouteille 1: ' + Bouteilles[1].name + Bouteilles[1].millesime);
console.log ('Bouteille 2: ' + Bouteilles[2].name + Bouteilles[2].millesime);

for(var myKey in Bouteilles) {
   console.log("name:"+Bouteilles[myKey].name+", millesime:"+Bouteilles[myKey].millesime);
}