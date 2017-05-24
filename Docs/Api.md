# Dizi
## API in a Nutshell
### Version: 1.0.0

#### Methods:
##### Http & Templating
* `.render()` Reading & Rendering a template using object dataset. Parameters:
    * document (String: file adress/text)
    * dataset (object {tagX: replacementY}) _optional
    * encoding (default:'utf8') _optional

*.render() method, also looks for 'same_file_name.json' in same path for localisation and templating. That json file may be like this:*
```
// same/path/same_file_name.json :
{
    'localisation':{
        'en':{
            'dinner': 'dizi'
        },
        'fa':{
            'dinner': 'دیزی'
        }
    },
    'tag': 'Replaced tag',
    'another tag': 'another Replacement'
}
```  

* `.parse(nodejs_request, req_body_buffer)`  
Parses request body etc >> server_handler function

* `.createServer(handler<function>, port<number>)`  
Creates and returns instance of http server.
    * handler_function (Integrated_parsed_request [obj], nodejs_req, nodejs_res) {
        * Integrated_parsed_request (ipr) object includes:
            1. headers: object {host, 'content-type', remote, method, etc...}
            2. post: object (Multipart/Form-data) { files[{name, filename, value, length, etc...}, ...], fields{name:{value}, name:[val1,val2]...}}
            3. post: buffer / json / etc
            4. url:  String '/home/page/search?q=value'
            5. path: array of path steps ['home','page'] 
            6. target: string 'search'
            7. query: object {'q':'value'}
            8. session: object {id, token, data(user defined), last-attempt, etc...}
            9. cookie: object {'cook':'value',...}
        * /* you can response, NodeJs like: */ nodejs_res.writeHead(xx) 
        * /* or simply: */ return
            1. boolean (false: e404 / true: app.document)
            2. String  (Looking for html tags, then: text/plain | text/html)
            3. Object  (application/json)
            4. Buffer / File
            
    };
* `.route('from','to')`

* `<ipr.post.file[i]>.save()`  
Returns Absolute Path of Saved File. 
Optional Parameters: 
    * filename
    * path
    * options {encoding, mode, flag} / 'utf8'
    * callback

*Note: `.save(true)` saves file with its name to default media `.folder` path and `.save(null)` creates a unique file name using current times stamp.*

##### Sessioning
* dizi`.sessioning`
    * [max-age] (seconds)
    * .decay (seconds)
    * .check-interval (seconds)
* ipr`.session`
    * `.sign(id<string>, data<userdefined|null>, Decay<seconds|7*60>)`
    * `.set(id<Default this.id>, data<userdefined>)`
    * `.get(id)` // returns session by id default current session
    * `.update(id<Default this.id>)` // updates Last-attempt to current time
    * `.isActive(id<Default this.id>)` // boolean
    * `.check(id<Default this.id>)` // status number (-1,0,1 : fired, decayed, active) + used in automatic expire Check

##### Cookie
* ipr`.cookie`
    * `.set('name','value',{'Duration':<secounds>, HttpOnly:<boolean>, Secure:<boolean>, 'Max-Age':<secounds>, Path:<null/string>, Domain:<null/string>});`
    * `.set('name','value',60)` // expires after 60 seconds
    * `.set('name','value','flags like: HttpOnly;')`

##### Jodo (JavaScript Object Database Operation)
Creating a Jodo database object:
* dizi`.jodo('path/to/file.json')`
* dizi`.jodo(object)`   
each returns jodo-object, with these properties:

    * jodo-object`.path` String (path of flat json file)

    * jodo-object`.save()` saves current state of object to json file.
    * jodo-object`.save('Optional_Path/to/file.json')` saves current state of object to new json file.

    * jodo-object`.any()` // Search Function. parameters:
        * field (string) where to search
        * condition (optional - string: !=|>=|... Default: '==')
        * value (string) what to search
        * Case insensetive (boolean - Default:true)
        * Manipulator_function (value, entry) // call on each found value and entry
    * nested-jodo-object|subfields`.any()` // to the deeper levels   
    Exmple: db.any()  db.users.any()  db.users.persians.any()

#### Events
Dizi Apps are Naturally Event Emitters:
* `render` : Rendering is done and app.document is ready.
* `render_callback` : Callback of render function is invoked.
* `request_ready` : Request & its body are completely received.
* `limit` : Payload Too Large >> Request is truncated to limit (dizi.limit).
* `session_created`
* `session_exited`
* `session_fired`

#### Properties
Any Instance of Dizi has this Properties:
* `.index` String (html file/Adress)
* `.folder` String -- Path to Media Folder (Default: 'root/saved_files');
* `.tagMarker` String (like '#' for #tags) / Array (like ['%','%'] for %tags%)
* `.callback` Function (Will be called, if there is not any callback for .render method -- Default: undefined)
* `.e404` Object (Default 404 Page. like: {data:'Not Found', 'content-type':'text/plain'})
* `.document` String (Stored recent result of .render method)
* `.server` Http Server (Made by .createServer method)
* `.timeout` Milliseconds (Server timeout - Default: 120000)
* `.limit` Bytes (Payload of request body - Default: 1000000 (1MB) )
* `.root` String (Default process.cwd())
* `.public` Array ['path/to/public/folder1', '/statics', ...]
* ` .localisation` Array ['en','fa']; // Available localisations (1st one is Default) // null = en
* `.renderables` Array ['html','htm','txt','xml','md','csv','text','xhtml']
