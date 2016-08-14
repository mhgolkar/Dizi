/*
//  .____________________________________________.
//  |            ____  __  ____  __              |
//  |           (    \(  )(__  )(  )             |
//  |            ) D ( )(  / _/  )(              |   
//  |           (____/(__)(____)(__)             |
//  |____________________________________________|
//  | NodeJs Framework for Retro Web Development | 
//  '--------------------------------------------'
//  Dizi
//  1.0.0
//  Morteza H. Golkar
//  License: MIT
*/

'use strict';
// Requirments
const http = require('http');
const fs = require('fs');
const os = require('os');
const H = require('http');
const P = require('path');
const Q = require('querystring');
const U = require('url');

// Dizi...........
var Dizi = function () {
    const self = this;
    this.root = process.cwd();
    this.folder = "saved_files";
    this.tagMarker = ["%","%"];
    this.callback = undefined;
    this.document = null;
    this.localisation = ["en","fa"]; // Avilable localisations (1st one is Default) // null = en
    this.e404 = {data: "The server has not found anything matching the Request-URI", 'content-type':"text/plain; charset=utf-8"};
    this.server;
    this.timeout = 120000; // Milliseconds (Default 2 Minutes)
    this.limit = 1000000; // Maxinum Bytes in post Body (Default: 1 MB)
    this.public = [];
    this.index = false;
    this.renderables = ["html","htm","txt","xml","md","csv","text","xhtml"];
    this.router = {}; this.route = function(from,to){ this.router[from] = to; };
    this.render = function () {
        // Mastering Arguments & Optionals
        var worksheet = arguments[0] || "";
        var dataset = {}, encoding = 'utf8', base = arguments[0], callback = this.callback;
        if (!worksheet && base.length > 0) {
            worksheet = base;
        } else if (!worksheet) {throw new Error("No HTML input of any Kind!"); }
        for (var i = 0; i< arguments.length; i++) {
            var arg = arguments[i];
            if (typeof arg == "object"){
                if( Object.keys(dataset).length === 0 ){
                    dataset = arg;
                } else {
                    // + Options {localisation:'fa',...}
                        //No Array Policy
                    try{
                        for(var op in arg){
                            dataset[op] = arg[op];
                        };
                    } catch(x){};
                };
            };
            if (typeof arg == "string") { if (arg != base) encoding = arg };
            if (typeof arg == "function") { callback = arg; };
        }
        // Replacing Tags
        var st = (typeof this.tagMarker == "string") ? this.tagMarker : this.tagMarker[0];
        var nd = (typeof this.tagMarker == "string") ? "" : this.tagMarker[1];
        var replacer = function(x){
            if (!x) throw new Error("Bad input");
            var proc = x;
            for (var i in dataset){
                while( proc.indexOf(st+i+nd) != -1){
                    proc = proc.replace(st+i+nd, dataset[i])
                }
            }
            return proc;
        };
        // Generating Localisation-Ready Dataset + Flat File Data (Tags)
        try{
        var localist = dataset.localisation || this.localisation[0] || "en";
            if( fs.statSync(worksheet).isFile() ){
                var extnOfSheet = P.extname(worksheet);
                var pathOfDataset = worksheet.replace(extnOfSheet,".json");
            // Harvesting Data From Same Name Json Files in Same Folder
                try{
                    if( fs.statSync(pathOfDataset).isFile() && pathOfDataset != worksheet){
                        var localSheet = fs.readFileSync(pathOfDataset,"utf8")
                        var localDataset = JSON.parse(localSheet);
                        if ( ("localisation" in localDataset) && (localist in localDataset.localisation) ){
                            var localisationDataset = localDataset.localisation[localist];
                            for (var l in localisationDataset){
                                localDataset[l] = localisationDataset[l];
                            };
                            delete localDataset.localisation;
                        };
                        // More Data from Json File
                        if (Object.keys(dataset).length === 0) {
                            dataset = localDataset;
                        } else {
                            for (var ld in localDataset){
                                if( !(ld in dataset) ){
                                    dataset[ld] = localDataset[ld];
                                };
                            };
                        };
                    };
                } catch(x) {};
            };
        } catch(x) {};
        // Rendering
        // + Input is file / text / object ?
        var proceed;
        var send = function(proceed,haveCallback){
            self.document = proceed;
            self.emit('render', proceed);
            if(haveCallback){
                callback(proceed);
                self.emit('render_callback');
            }
            return proceed;
        };
        if (!callback){
            if (typeof worksheet == "object") {
                proceed = replacer((worksheet).join("")) 
            } else {
                try{
                    proceed = replacer( fs.readFileSync(worksheet, encoding) );
                } catch(x){
                    proceed = replacer( worksheet );
                }
            }
            return send(proceed,false);
        } else {
            if (typeof worksheet == "object") {
                proceed = replacer((worksheet).join(""));
                return send(proceed,true);
            } else {
                fs.readFile(worksheet, encoding, function(err,data){
                    if (err) {
                        // worksheet <text/html>
                        proceed = replacer(worksheet);
                        return send(proceed,true);
                    }
                    else{
                        // worksheet <File adress>
                        proceed = replacer(data);
                        return send(proceed,true);
                    }
                });
            }
        }
    };
    this.parse = function(req, buf){
        const EOL = os.EOL;
        const EOLbin = {
            ms: Buffer.from("\r\n","ascii"),
            ux: Buffer.from("\n","ascii"),
            os: Buffer.from(EOL,"ascii")
        };
        // Mastering Arguments + Controler
        var errMsg = "Wrong input on parsing request. We Need a 'request' <incoming message> and a <buffer>.";
        if ( arguments.length < 1 ) {
            throw new Error(errMsg);
        } else {
            for(var ar = 0 ; ar<arguments.length; ar++){
                var arvar = arguments[ar]
                if ( arvar instanceof H.IncomingMessage ) {
                    var req = arvar; 
                } else if ( Buffer.isBuffer(arvar) ) {
                    var buf = arvar; 
                } else {
                    try{ buf = Buffer.from(arvar); }
                    catch(x){ buf = Buffer.from(" "); }
                };
            };
            if ( !req || !buf || !(req instanceof H.IncomingMessage) ){
                throw new Error(errMsg);
            }
        };
        // Mastering Request Object
        var request = {}
        // Parse URL & Query
        request.url = U.parse(req.url);
        request.query = Q.parse(request.url.query);
        request.url = Q.unescape(U.format(request.url));
        request.path = request.url.split("/");
            if( request.path[0] == "") request.path.shift();
            var lastInpath = request.path[request.path.length-1];
            var indexOfXiS = lastInpath.indexOf("?");
        request.target = ( indexOfXiS != -1) ? request.path.pop().slice(0, indexOfXiS) : request.path.pop() ;
        // parse Headers
            //Content-Type:
        var contentType = req.headers['content-type'];
        var hdrs = contentType ? Q.parse(contentType
                                      .replace(/\s/g,"")
                                      .replace(/;/g,"&")
                                      .replace(/:/g,"=")
                                        ) : {};
        for (var i in hdrs) { 
            if( hdrs[i] == '' ) {
                hdrs['content-type'] = i;
                delete hdrs[i];
                break;
            }
        };
            // Cookies & Other header Fields
        request.cookie = {};
        Object.defineProperty(request, "CooCoo", {value:[], enumerable:false}); // We Keep Cookie Dough Here
        for (var i in req.headers){
            if (i == 'cookie') {
                var ckr = req.headers[i].split(";");
                ckr.forEach(function(x){
                    var ind = x.indexOf("=");
                    var ckn = x.slice(0,ind).trim();
                    var ckv = x.slice(ind+1);
                    request.cookie[ckn] = ckv;
                });
            };
            if (i == 'content-type') { req.headers[i] =  hdrs['content-type']; };
            // else import to headers
            hdrs[i] = req.headers[i];
        };
        // Set Headers Up:
        request.headers = hdrs;
            // + Some More ...
        request.headers.remote = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        request.headers.method = req.method;
        request.headers.statusCode = req.statusCode;
        request.headers.statusMessage = req.statusMessage;
        // Server Could Set Cookie Header:
        Object.defineProperty(request.cookie, "set", {
            value: function(name,value,options){
                var flags = "";
                if(options) {
                    if(typeof options == "object"){
                        for (var op in options){
                            switch (op.toLowerCase()){
                                case 'duration':
                                    var socounds = (typeof options[op] == "number") ? options[op] : 0;
                                    var expireTime = (new Date( parseInt(new Date().getTime()) + (socounds*1000)) ).toGMTString();
                                    flags += " Expires="+ expireTime +"; Max-Age="+ socounds +";";
                                    break;
                                case 'expires':
                                    flags += " Expires=" + options[op] + ";";
                                    break;
                                case 'httponly':
                                    if( options[op] === true ){ flags += " HttpOnly;"; };
                                    break;
                                case 'secure':
                                    if( options[op] === true ){ flags += " Secure;"; };
                                    break;
                                case 'max-age':
                                    if(typeof options[op] == "number") { flags += " Max-Age="+ options[op] +";"; };
                                    break;
                                case 'path':
                                    flags += " Path=" + options[op] + ";";
                                    break;
                                case 'domain':
                                    flags += " Domain=" + options[op] + ";";
                                    break;
                            };
                        };
                    } else if(typeof options == "string"){
                        flags = options;
                    } else if(typeof options == "number"){
                        var expireTime = (new Date( parseInt(new Date().getTime()) + options*1000) ).toGMTString();
                        flags = "Expires="+ expireTime +"; Max-Age= "+ options +";";
                    };
                };
                var cookie = name + '=' + value +'; ' + flags;
                request.CooCoo.push(cookie);
                request.cookie[name] = value;
                return cookie;
            },
            enumerable: false
        });
        // Parse POST Body
        request.post = {}
        // Multipart/Form-Data
        if( (request.headers.boundary != undefined) && Buffer.isBuffer(buf) && buf.length>2 ) {
            var wBody = buf;
            // Discovering EOL type
            var xEOL = function findEol(x){
                if ( wBody.indexOf(x.ms) != -1 ) return x.ms;
                if ( wBody.indexOf(x.ux) != -1 ) return x.ux;
                throw new Error("Unexpected EOL Character(s)");
            }(EOLbin);
            // Harvesting Boundary
            var bnd = wBody.slice( 0 , wBody.indexOf(xEOL) );
            // Spliting on Boundary
            var loEOL = xEOL.length;
            var xBody = [];
            do {
                var ixbnd = wBody.indexOf(bnd,"binary")+bnd.length+loEOL;
                var lxbnd = wBody.indexOf(bnd, ixbnd,"binary")-loEOL;
                var wSlice = wBody.slice(ixbnd,lxbnd);
                wBody = wBody.slice(lxbnd);
                xBody.push(wSlice);
            } while( wBody.lastIndexOf(bnd) != wBody.indexOf(bnd) );
            // Mastering & Sorting Data
            var yBody = {files:[/*[lable,value]*/], fields:[]};
            for( var t=0; t<xBody.length; t++){
                var iyEOL = xBody[t].indexOf(xEOL+xEOL);
                var xyLable = xBody[t].slice(0,iyEOL);
                var xyValue = xBody[t].slice(iyEOL+loEOL*2);
                var lableString = xyLable.toString().toLowerCase();
                var flnm_repl = /filename=["|'][^\n|\r\n|]*.\w["']/ig.exec(lableString);
                    flnm_repl = flnm_repl ? flnm_repl[0] : "";
                var xyEntry = Q.parse( lableString
                                      .replace(flnm_repl, flnm_repl.replace(/\s/g, "_")) //Replace Whitespaces in Filename
                                      .replace(new RegExp(xEOL.toString(),"g"), ";")
                                      .replace(/;/g, "&")
                                      .replace(/:/g, "=")
                                      .replace(/\"/g, "")
                                      .replace(/\s/g, "")
                                     );
                if( xyLable.includes(xEOL) ){
                    // Is File
                    xyEntry.value = xyValue;
                    xyEntry['ext'] = xyEntry.filename.slice(xyEntry.filename.lastIndexOf("."));
                    xyEntry['length'] = xyValue.length;
                        // + .save() Property
                        Object.defineProperty(xyEntry,"save",{
                            enumerable: false,
                            value: function () {
                                var name, address ,options, callback;
                                // Naming Conventions
                                function check(input,mode){
                                    var result = (mode == 0) ? input.replace(/<|>|:|"|\\|\||\?|\*|\n|\r\n|;|\./g,"_") : input.replace(/<|>|:|"|\/|\\|\||\?|\*|\n|\r\n|;/g,".");
                                    for (var cc = 0; cc < result.length; cc++){
                                        if ( result.charCodeAt(cc) <= 32 ){
                                            result = result.replace(result.substring(cc,cc+1),"-");
                                        };
                                    };
                                    var forbiden = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
                                    if( forbiden.includes(result) || result.length<4 ){ result = "nced_" + result; };
                                    return result;
                                };
                                // Mastering Optional arguments
                                for(var indx=0; indx<arguments.length; indx++){
                                    ar = arguments[indx];
                                    switch (typeof ar){
                                        case 'string':
                                            try{
                                                var tempaddr = P.join(self.root, ar);
                                                if( fs.statSycn(tempaddr).isFolder() ){
                                                    address = ar;
                                                };
                                            } catch(x) {
                                                if( indx == 0 ){
                                                    name = check(ar,1);
                                                } else if(indx == 1) {
                                                    address = check(ar,0);
                                                } else {
                                                    options = ar || "utf8";
                                                };
                                            };
                                            break;
                                        case 'object':
                                            options = ar;
                                            break;
                                        case 'function':
                                            callback = ar;
                                            break;
                                        case 'boolean':
                                            if(ar == true){
                                                address = "";
                                                name = check(this.filename, 1);
                                            };
                                            break;
                                        default:
                                            break;
                                    };
                                };
                                self.folder = self.folder ? self.folder : "";
                                if(!name){
                                    var current = (new Date()).toLocaleString().replace(/:|\/|,| /g,".").replace("..",".");
                                    name = check(current +"_"+ this.filename, 1);
                                };
                                if(!address){ address = ""};
                                if(!options){ options = "utf8"};
                                // Get Ready to Save...
                                var data = this.value;
                                var directory = P.join(self.root, self.folder, address);
                                var file = P.join(directory, name);
                                // is address folder avilable?
                                try{
                                    fs.statSync(directory).isDirectory();
                                } catch(x) {
                                    // Make Directories
                                    var dir = directory.split(P.sep);
                                    dir.reduce(function(pre,cur){
                                        var cdr = P.join(pre,cur);
                                        try{
                                            fs.statSync(cdr).isDirectory();
                                        } catch(x) {
                                            fs.mkdirSync(cdr);
                                        };
                                        return cdr;
                                    });
                                }
                                // Now Save...
                                if(callback){
                                    fs.writeFile(file, data, options, callback);
                                } else {
                                    fs.writeFileSync(file, data, options);                                    
                                };
                                self.emit("saved",file);
                            return file; // Returns Absolute File Path
                            }
                        });
                        // File is not Empty
                    if( xyEntry['length'] > 0 ) yBody.files.push(xyEntry);
                } else {
                    // Is Field 
                        //+ Sorting
                    var temp = xyEntry.name;
                    var strValue =  xyValue.toString();
                    if( !yBody.fields[temp] ){
                            // New Field
                        yBody.fields[temp] = strValue;
                    } else {
                            // Existing Field
                        if( (typeof yBody.fields[temp]) != 'object' ){
                            yBody.fields[temp] = [ yBody.fields[temp], strValue ];
                        } else {
                            yBody.fields[temp].push(strValue);
                        }
                    };
                };
            };
            // Insert to Request
            request.post = yBody;
        // Other Enctypes
        } else if( request.headers['content-type'] ) {
            // Encoding ?
            var charset = (request.headers.charset || "utf8").toLowerCase();
            var bodyEncoding = ["ascii","utf16le","ucs2","base64","binary","hex"].indexOf(charset) ? charset : "utf8";
            // Parse on..
            switch( (request.headers['content-type']).toLowerCase() ){
                case "application/x-www-form-urlencoded":
                    var parsedBody =  Q.parse( buf.toString(bodyEncoding) );
                    break;
                case "application/json":
                    var parsedBody = JSON.parse(buf);
                    break;
                case "text/plain":
                    var parsedBody = buf.toString(bodyEncoding);       
                    break;
                default: // Buffer :
                    var parsedBody = buf;
                    break;
            }
            request.post = parsedBody;           
        } else request.post = {};
        this.emit("request_ready", request);
        return request;
    };
    this.createServer = function(xhandler, xport){
        // Mastering Arguments
        var handler = (typeof xhandler == 'function') ? xhandler : function(){ return undefined; };
        var port = ((typeof xport == 'number') && (0 < xport < 65536)) ? xport : undefined;
        // Defining Boss Handler
        var echoHandler = function(req,res){
            // Parsing Body of Request
            var buf = [];
            var bufTempLength = 0;
            // Response when Request is ready
                // Response Handler
            var RespOnReq = function(echoReq) {
                var toWrite, toWriteHead;
                var toStatus = [200,"OK"];
                // Baking Cookies (Options Etc.)
                    // Ingredients
                var rndrOptns = {}; // Options for render {localisation:'x'...}
                echoReq.session = {};
                Object.defineProperties(echoReq.session, {
                    sign:{
                        enumerable: false,
                        value: function(_id, _data, _decay){
                            var cookie = self.sessioning.sign(_id, _data, _decay);
                            var ses = self.sessioning.get(_id);
                            for (var p in ses){
                                echoReq.session[p] = ses[p];
                            };
                            echoReq.CooCoo.push(cookie);
                        }
                    },
                    set:{
                        enumerable: false,
                        value: function(){
                            if (arguments.length>1){
                                var _id = arguments[0] || this.id;
                                var _data = arguments[1];
                            } else {
                                var _id = this.id;
                                var _data = arguments[0];                                
                            };
                            this.data = _data;
                            return self.sessioning.set(_id, _data);
                        }
                    },
                    get:{
                        enumerable: false,
                        value: function(_id_token){
                            var _token = _id_token || this.token;
                            return self.sessioning.get(_token);
                        }
                    },
                    update:{
                        enumerable: false,
                        value: function(_id_token){
                            var _token = _id_token || this.token;
                            return self.sessioning.update(_token);
                        }
                    },
                    exit:{
                        enumerable: false,
                        value: function(_id_token){
                            var _token = _id_token || this.token;
                            return self.sessioning.exit(_token);
                        }
                    },
                    fire:{
                        enumerable: false,
                        value: function(_id_token){
                            var _token = _id_token || this.token;
                            return self.sessioning.fire(_token);
                        }
                    },
                    isActive:{
                        enumerable: false,
                        value: function(_id_token){
                            var _token = _id_token || this.token;
                            return self.sessioning.isActive(_token);
                        }
                    },
                    check:{
                        enumerable: false,
                        value: function(_id_token){
                            var _token = _id_token || this.token;
                            return self.sessioning.check(_token);
                        }
                    }
                });
                    // Baking
                var toBake = echoReq.cookie;
                if( toBake && Object.keys(toBake).length !== 0 ){
                    if ( ('localisation' in toBake) && (self.localisation.includes(toBake.localisation))){
                        rndrOptns.localisation = toBake.localisation; 
                    };
                    if ('session_token' in toBake){
                        var token = toBake.session_token;
                        if(self.sessioning.get(token) && self.sessioning.get(token).status > -1){
                            if (self.sessioning.get(token).status > 0) { self.sessioning.update(token); };
                            var ses = self.sessioning.get(token);
                            for (var p in ses){
                               echoReq.session[p] = ses[p];
                            };
                        };
                        delete echoReq.cookie.session_token; // Celaning Cookies
                    };
                };
                // Automatic Routing
                if(echoReq.url in self.router){
                    // Revising echoReq
                    echoReq.url = U.parse(self.router[echoReq.url]);
                    echoReq.query = Q.parse(echoReq.url.query);
                    echoReq.url = Q.unescape(U.format(echoReq.url));
                    echoReq.path = echoReq.url.split("/");
                    if( echoReq.path[0] == "") echoReq.path.shift();
                    var lastInpath = echoReq.path[echoReq.path.length-1];
                    var indexOfXiS = lastInpath.indexOf("?");
                    echoReq.target = ( indexOfXiS != -1) ? echoReq.path.pop().slice(0, indexOfXiS) : echoReq.path.pop() ;
                };
                // Harvesting Response from User Defined Handler Function
                var response = handler(echoReq,req,res);
                // Automatic Response to Public(s)/Static(s)
                if( self.public.includes(echoReq.path[0]) || self.public.includes(echoReq.path.join("/")) ){
                    // It's a request to public
                    var pathOfPublic = P.join(self.root, echoReq.url);
                    var extnOfPublic = (P.extname(pathOfPublic)).slice(1);
                    var extensome = /htm/gi.test(extnOfPublic) ? html : (/xt/gi.test(extnOfPublic) ? "plain" : extnOfPublic );
                    try{
                        if(self.renderables.includes(extnOfPublic) && fs.statSync(pathOfPublic).isFile()){
                            var contentOfPublic = self.render(pathOfPublic, rndrOptns);
                            toWriteHead = {'content-type':'text/'+extensome+'; charset=utf-8'};
                        } else {
                            var contentOfPublic = fs.readFileSync(pathOfPublic);
                        };
                        toWrite = contentOfPublic;
                    } catch(x){
                        toStatus = [404,"Not Found"];
                    };
                } else {
                    // It's Not Public >> (User Defined Handler) Response >>
                    switch(typeof response){
                        case 'object':
                            // is buffer to send file
                            if( Buffer.isBuffer(response) ){
                                toWrite = response;
                                break;
                            } else {
                                // is Json to send as application/json
                                toWriteHead = {'content-type':'application/json; charset=utf-8'};
                                toWrite = JSON.stringify(response);
                                break;
                            };
                        case 'string':
                            // is HTML or Plain?
                            if ( /<[a-z][\s\S]*>/i.test(response) ) {
                                toWriteHead = {'content-type':'text/html; charset=utf-8'};
                            } else {
                                toWriteHead = {'content-type':'text/plain; charset=utf-8'};
                            };
                            toWrite = response;
                            break;
                        case 'number':
                            var resNum = parseInt(response);
                            const statusCodes = http.STATUS_CODES;
                            if(resNum in statusCodes){
                                // Send Status Code and Message
                                toStatus = [ resNum, statusCodes[resNum] ];
                                toWrite = statusCodes[resNum];
                            } else if(resNum == response && 99<resNum && resNum<600) {
                                toStatus = [resNum, "Unofficial Response"];
                            } else {
                                // Send Number as plain text
                                toWriteHead = {'content-type':'text/plain; charset=utf-8'};
                                toWrite = "" + response;
                            };
                            break;
                        case 'boolean':
                            if(!response){ // Handler returned false
                                toStatus = [404, "Not Found"];
                                toWriteHead = {'content-type': self.e404['content-type']};
                                toWrite = self.e404.data;
                            } else {
                                toWrite = self.document;
                            };
                            break;
                        default:
                            if(!response){
                                if( self.index && echoReq.path.length == 0 && echoReq.target == ""){
                                    toWriteHead = {'content-type':'text/html; charset=utf-8'};
                                    toWrite = self.render( P.join(self.root,self.index), rndrOptns );
                                    break;
                                } else {
                                    toStatus = [404, "Not Found"];
                                    toWriteHead = {'content-type': self.e404['content-type']};
                                    toWrite = self.e404.data;
                                    break;
                                };
                            } else {
                                toWrite = response;
                                break;
                            }
                    };
                };
                // Hot Cookies to send
                if( echoReq.CooCoo.length > 0 ){ res.setHeader('set-cookie', echoReq.CooCoo); };
                // Do it! Response!
                res.writeHead(toStatus[0] || 404, toStatus[1] || "not Found", toWriteHead || null);
                res.write(toWrite || "");
                res.end();
            };
            req.on('data', function(chunk) {
                if ( bufTempLength < self.limit || self.limit == -1 ){
                    buf.push(chunk);
                    bufTempLength += chunk.length;
                } else {
                    // when request body is larger than limit:
                    req.removeAllListeners('data');
                    self.emit("limit");
                };
            });
            req.once('end',function(){
                req.removeAllListeners('data');
                if(buf.length == 1){
                    if ( !Buffer.isBuffer(buf) ){
                        buf = Buffer.from(buf[0]); 
                    };
                } else if(buf.length > 1) {
                    if ( Buffer.isBuffer(buf[0]) ){
                        buf = Buffer.concat(buf); 
                    } else {
                        buf = Buffer.from( buf.join("") );
                    };
                } else { buf = Buffer.from(" ") };
                RespOnReq(self.parse(req, buf));
                bufTempLength = 0;
            });
        };
        this.server = http.createServer(echoHandler);
        this.server.setTimeout(this.timeout);
        if (port !== undefined) this.server.listen(port);
        return this.server;
    };
    this.sessioning = {
        'check-interval': 60, // Secounds
        'max-age': 15*60, // Secounds (to fire session after last attempt + cookie-max-age)
        decay: 7*60, // Secounds (to exit session after last attempt)
        index: {}, // {'xid':'xtokenx',...};
        store: {}, // {'xtokenx':{id:'xid', token:'xtokenx', data<user_defined>, 'last-attempt':<Date>, fingerprint:<string>, status<-1/0/1>, decay<sec_opt>},...};
        // Methods
        sign: function(_id, _data, _decay){ //return session_cookie (token=x;HttpOnly;Expires=...)
            if( Object.keys(this.index).length == 0 ) self.session_start_autocheck();
            if (typeof _id != "string") return false;
            if (_id in this.index){
                var _token = this.index[_id];
            } else {
                var _token = function(x) {
                    // javascript implementation of javas string hashcode method
                    var hash = 0, i, chr, len;
                    if (x.length === 0) return hash;
                    for (i = 0, len = x.length; i < len; i++) {
                        chr   = x.charCodeAt(i);
                        hash  = ((hash << 5) - hash) + chr;
                        hash |= 0; // Convert to 32bit integer
                    }
                    return hash;
                }(_id + parseInt(new Date().getTime() + Math.random*1000) );
                // is Token Unique?
                while (_token in this.store) {
                    _token += parseInt(Math.random()*10);
                };
                this.index[_id] = _token;
            };
            this.store[_token] = {
                id: _id,
                token: _token,
                data: _data,
                decay: (_decay && typeof _decay == 'number') ? _decay : this.decay,
                'last-attempt': new Date(),
                status: 1,
                fingerprint: null
            };
            var expireTime = (new Date( parseInt(new Date().getTime()) + (this['max-age']*1000)) ).toGMTString();
            var cookie = "session_token="+_token+"; HttpOnly; Max-age="+this['max-age']+"; Expires="+expireTime+";";
            self.emit("session_created",cookie);
            return cookie;
        },
        set: function(id_token, _data){ // Change or set user defined data to session
            var token = (id_token in this.index) ? this.index[id_token] : (id_token || "False Token");
            if( token in this.store){
                this.store[token].data = _data || null;
                return this.store[token];
            } else return false;
        },
        get: function(id_token){ // {id, data, 'last-attempt', status}
            var token = (id_token in this.index) ? this.index[id_token] : (id_token || "False Token");
            if( token in this.store){
                return this.store[token];
            } else return undefined;
        },
        update: function(id_token){ // Attempts!
            var token = (id_token in this.index) ? this.index[id_token] : (id_token || "False Token");
            if( token in this.store){
                this.store[token]["last-attempt"] = new Date();
                return this.store[token].status;
            } else return false;
        },
        exit: function(id_token){ // Unsign Session // 0  
            var token = (id_token in this.index) ? this.index[id_token] : (id_token || "False Token");
            if( token in this.store){
                var stat = this.store[token].status;
                if( stat > 0){
                    this.store[token].status = 0;
                    var id2go = this.store[token].id;
                    self.emit("session_exited",id2go);
                    return 0;
                } else if (stat == -1){
                    this.fire(token);
                };
            } else return -1;
        },
        fire: function(id_token){ // Remove Session // -1 
            var token = (id_token in this.index) ? this.index[id_token] : (id_token || "False Token");
            if( token in this.store){
                this.store[token].status = -1;
                var id2go = this.store[token].id;
                delete this.index[id2go];
                delete this.store[token];
                self.emit("session_fired",id2go);
                return -1;
            } else return -1;
        },
        isActive: function(id_token){ // Boolean of Status
            var token = (id_token in this.index) ? this.index[id_token] : (id_token || "False Token");
            if( token in this.store){
                var stat = this.store[token].status;
                var boolean = (stat < 1) ? false : true;
                return boolean;
            } else return undefined;
        },
        check: function(id_token){ // Check for True Status & Action
            var token = (id_token in this.index) ? this.index[id_token] : (id_token || "False Token");
            if( token in this.store){
                var lst = parseInt(this.store[token]["last-attempt"].getTime());
                var now = parseInt(new Date().getTime());
                var mxa = this["max-age"];
                var dcy = this.store[token].decay || this.decay;
                var dur = ((now - lst) / 1000); // millsec to sec
                var result = this.store[token].status || -1 ;
                if( dur > mxa ){ var result = this.fire(token); }; // Expired
                if( dur > dcy ){ var result = this.exit(token); }; //Decayed
                return result;
            } else return -1;
        }
    };
    this.jodo = function(xjx){
        // Generating New Jodo (Jason Object Database Operator)
            // From file or Object ?
        if(typeof xjx == 'string'){
            var document = fs.readFileSync(xjx, "utf8");
            var db = document ? JSON.parse(document) : false;
        } else if(typeof xjx == 'object'){
            var db = xjx;
        };
        // jodo helper Functions
            // The Magic 'any' Function:
        const any_func = function(_where, _cond, _what, _ci, _callback){
            // Mastering Optional Arguments
            var where, cond, what, ci, callback;
            where = arguments[0];
            for (var ar = 1; ar<arguments.length ;ar++){
                if( ['==','!=','<','>','<=','>=','===','!==',].includes(arguments[ar]) ){
                    cond = arguments[ar];
                } else if(typeof arguments[ar] == 'function') {
                    var callback = arguments[ar];
                } else {
                    if(!cond) cond = "==";
                    if(ar <= 2) {
                        if(!what) what = arguments[ar];
                    };
                    ci = (arguments[ar] === false) ? arguments[ar] : true;
                };
            };
            if(ci === null || ci === undefined) ci = true;
            // Define Search Function
            var search = function(x){
                if (Object.prototype.toString.call( x ) === '[object Array]'){
                    // x is Array
                    var result = [];
                    x.forEach(function(w){
                        var res = search(w);
                        if (res) result = result.concat(res);
                    });
                    return ((result.length !== 0)? result: null);
                } else if (typeof x == 'object') {
                    // x is Object
                    for(var w in x){
                        if(typeof x[w] == 'object'){
                            var result = {};
                            for (var w in x){
                                var res = search(x[w]);
                                if (res) result[w] = res;                                            
                            }
                            return ( (Object.keys(result).length !== 0) ? result : null );
                        } else {
                            function condor(x,y){
                                //Test for condition ('==','!=','<','>','<=','>=','===','!==')
                                switch(cond){
                                    case "==" : return (x == y);  break;
                                    case "!=" : return (x != y);  break;
                                    case "<"  : return (x < y);   break;
                                    case ">"  : return (x > y);   break;
                                    case "<=" : return (x <= y);  break;
                                    case ">=" : return (x >= y);  break;
                                    case "===": return (x === y); break;
                                    case "!==": return (x !== y); break;
                                    default   : return (x == y);  break;
                                };
                            };
                            if(ci){
                                // Case Insensetive
                                if(typeof what == 'string' && typeof x[w] == 'string'){
                                    var wt = what.toLowerCase();
                                    var xw = x[w].toLowerCase();
                                } else { var xw = x[w]; var wt = what; };
                                if(
                                    (w.toLowerCase() == where.toLowerCase())
                                    && condor(xw, wt)
                                  ){
                                    // Found
                                    if(callback){
                                        var crs = callback(x[w], x);
                                        if (crs != undefined){ x[w] = crs };
                                    };
                                    return x;
                                }
                            } else {
                                // Case Sensetive                                        
                                if( where == w && condor(x[where], what) ){
                                    // Found
                                    if(callback){
                                        var crs = callback(x[where], x);
                                        if (crs != undefined){ x[where] = crs };
                                    };
                                    return x;
                                } else return null;
                            };
                        };
                    };
                } else {
                    // x is Unsearchable (String Etc...)
                    return null;
                };
            };
            // Taking Action on any():
            var box = this;
            if (Object.prototype.toString.call( box ) === '[object Array]'){
                // Array
                var result = [];
                box.forEach(function(x){
                    var res = search(x);
                    if (res) result = result.concat( res );
                });
                return result;
            } else if (typeof box == 'object') {
                // object
                var result = {};
                for (var x in box){
                    var res = search(box[x]);
                    if (res) result[x] = res;
                }
                return result;                            
            };
        };
        // Generating Jodo Database :
        if( db ){
            Object.defineProperties(db,{
                path:{
                    enumerable: false,
                    writable: false,
                    configurable: false,
                    value: (typeof xjx == "string") ? xjx : null
                },
                queue:{
                    enumerable: false,
                    configurable: false,
                    value: []
                },
                save:{
                    enumerable: false,
                    configurable: false,
                    writable: false,
                    value: function(new_path){
                        var current = JSON.stringify(this);
                        if(new_path){
                            var absolute = P.join(self.root, new_path);
                            try{
                                fs.writeFileSync(absolute, current, "utf8");
                                return { 
                                    path: absolute,
                                    status: fs.statSync(absolute)
                                };
                            } catch(x){return false};
                        } else {
                            this.queue.push(current);
                            var selfob = this;
                            current = null;
                            var savySave = function(){
                                if(selfob.queue.length > 0){
                                    var absolute = P.join(self.root, selfob.path);
                                    var toSave = selfob.queue.shift();
                                    fs.writeFile(absolute, toSave, "utf8", function(err){
                                        if(err){
                                            selfob.queue.unshift(toSave);
                                        } else {
                                            try{
                                                var stuty = { path: absolute, status: fs.statSync(absolute) };
                                                self.emit('jodo-saved', stuty);
                                            } catch(x){};
                                        };
                                        return savySave();
                                    });                               
                                };   
                            };
                            savySave();
                        };
                    }
                },
                any:{
                    enumerable: false,
                    configurable: false,
                    writable: false,
                    value: any_func.bind(db)
                }
            });
            // Helper Functions (Properties) For Subfields of Database
            function definer(obj){
                if( Object.prototype.toString.call( obj ) === '[object Array]' ){
                    // it's array
                    obj.forEach(function(ent){
                        if(typeof ent == 'object' && obj[ent] != null){
                            if( ent.length > 0 || Object.keys(ent).length !== 0){
                                definer(ent);
                                Object.defineProperty(ent, 'any', {
                                    enumerable: false,
                                    configurable: false,
                                    writable: false,
                                    value: any_func.bind(ent)
                                });
                            };
                        };                        
                    });
                } else {
                    // it's Object
                    for(var ent in obj){
                        if(typeof obj[ent] == 'object' && obj[ent] != null){
                            if( obj[ent].length > 0 || Object.keys(obj[ent]).length !== 0){
                                definer(obj[ent]);
                                Object.defineProperty(obj[ent], 'any', {
                                    enumerable: false,
                                    configurable: false,
                                    writable: false,
                                    value: any_func.bind(obj[ent])
                                });
                            };
                        };
                    };
                };
            }; definer(db);
            // OK
            return db;
        } else return undefined;
    };
    // Automatics
        //Look for Expired or Inactive Sessions
    this.session_start_autocheck = function(){
        setInterval(function(){
                for(var ses in self.sessioning.index){
                    self.sessioning.check(ses);
                };
        }, this.sessioning["check-interval"]*1000);
    };
};

// + We need to Emit!
Dizi.prototype = (require('events')).EventEmitter.prototype;
// Going Module
module.exports = Dizi;
module.exports.jodo = (new Dizi).jodo;

// Ready To Use.