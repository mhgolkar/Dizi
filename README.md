# Dizi
Minimalist NodeJs Framework for Retro Web Development

## [ deprecated ]

### Features
* Reliable & Developer-Friendly
* No Dependency
* Easy Routing
* Automatic Public & Static folder Serving
* Integrated Parser (POST, GET, Multipart/Form-data, Files, Cookie, headers, etc >> Single Object)
* HTTP Server Handling with Ease (as writing a function)
* Built-in Template Engine & HTML/Text Rendering
* Sessioning & Cookie Handling
* Built-in Flat Json File Database (Jodo)

### API & Docs
for more information please take a look at:

* [API in a Nutshell](https://github.com/mhgolkar/Dizi/blob/master/Docs/Api.md)
* [Getting Started & Examlpes](https://github.com/mhgolkar/Dizi/blob/master/Docs/Getting_Started.md)

### Quick Start
#### Installation
**NPM:** `$ npm install dizi`
 or **Manual:** Just copy the `Dizi.js` file to your project.

#### Sample App
```
const Dizi = require('dizi');
var app = new Dizi();
app.public = ["media_storage","statics/images"]; // Statics etc.
// app.index = "./index.html"; // Automatic Indexing
app.route("/home","/?page=landing");

// Server Handler
var handler = function(ipr){
    console.log(ipr); // See What We Have
    // Manual indexing For Example
    if(ipr.query.page == 'landing' || ipr.url == "/"){
        return "Wellcome";
        //or: return app.render("index_template.html", {title:"Some Data", 'some tag':"More Data"})
    } else { return 404 };
};
var server = app.createServer(handler, 80);
// look: http://localhost/home
// >> Request >> Dizi >> handler(integrated_parsed_req+, nodejs_req, nodejs_res) >> Dizi >> Response
```
Dizi can Handle More Amazing Jobs, please take a look at [API](https://github.com/mhgolkar/Dizi/blob/master/Docs/Api.md), or Dizi Demo [Tutorial](https://github.com/mhgolkar/Dizi/blob/master/Docs/Getting_Started.md).

### License
MIT

Copyright © 2016 Morteza H. Golkar
