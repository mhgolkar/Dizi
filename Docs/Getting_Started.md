# Dizi
Version: 1.0.0
## Getting Started
### Installation
You may Install Dizi using 
**Node Package Manager** `$ npm install dizi` 
or **Manual** (Just copy the `Dizi.js` file to your work directory). 
There is also other ways, For more Information please check this links about installing npm packages [locally](https://docs.npmjs.com/getting-started/installing-npm-packages-locally) or [globally](https://docs.npmjs.com/getting-started/installing-npm-packages-globally)


### Demo Project: Open Address Book
#### 00. Ingredients
For our new Project 'open adress book (OAB)', we need few forms, templates & a database. Look for those things in `Docs/Demo project` folder in the Dizi Git Repo. Semi-Completed Demo Project is there.    
Thanks to Jodo, we can use JSON files as flat fil database. a sample `data.json` file is provided.  

```
Dizi Repo:
|...
|- Docs
    |- media [will be created by app]
        |...
    |- app.js
    |- data.json
    |- index.html
    |- profile.html
```

#### 01: Setting Dizi App Up
##### One. create `app.js`  
The Core of OAB is `app.js`. where dizi is working.     

```
var dz = require('dizi'); 
// or require('./Dizi.js') if is installed manually in the same path as app.

var app = new Dizi();
// + Flat File Database :
var db = app.jodo('./data.json');
```

##### Two. Creating Server   
`app.js` ++

```
// Indexing
app.index = './index.html';

// Server Handler
// All App in Single Function
var handler = function(dz){
    return "Hello Word"; // So No indexing
};

app.createServer(handler, 80)
console.log('Dizi Open Adress Book is Alive [localhost:80]');

```

Each time you `return` something from `handler` function, indexing will be overridden. So This handler means Say 'Hello Word' for ever.

#### 02: Mastering Requests
##### Conditions
For an advanced app on http server, you need to edit `handler` function in `app.js`.   
It's simple just read Integrated Parsed Request (1st argument, here: dz) and return response you like to write.

```
// Server Handler
// All App in Single Function
var handler = function(ipr){
    switch( ipr.target ){
    // The Page Which is Requested (Form Action)
        case 'search':
            break;
        case 'log':
            break;
        case 'new':
            break;
        case 'edit':
            break;
    };
};
```

request is parsed to ipr object-argument with some usefull properties. please take a look at [Api](Api.md).  
In our case, most exciting properties are `.target`, `.post` and `.query`.

##### Actions
let's use parsed post request in few conditions:  
`app.js` ++

```
...
switch( ipr.target ){
    // The Page Which is Requested (Form Action)
        case 'logout':
            if(ipr.session) ipr.session.exit();
            break;
        case 'log':
            if(ipr.post.username && ipr.post.password){
                //check for username and password
                    // search database
                var user = db.users.any('user','==', ipr.post.username, true)[0];
                if(user.pass == ipr.post.password){
                    // Ok. Passed. make session:
                    ipr.session.sign(ipr.post.username, user);
                } else {
                    // Templating for wrong password
                    home_dataset['alert'] = 'wrong username or password';
                }
            }
            break;
        case 'edit':
        ...
        ......
```

Source code has more details. But what about templating:

#### 03. Templating
We used tags like `%_user_adress_%` in templates. I mean our `.html` files. If you Like another pattern, edit `app.tagMarker=['%','%']` property. Ok. Let's play more:

```
...
....
case 'search':
            if('n' in ipr.query){
                // looking for query in: localhost/search?n=firstnameX&l=lastnameX
                var result = db.users.any('first', ipr.query.n, true);
                if (result.length>1){
                   result = app.jodo(result).any('last', ipr.query.l, true) || null;
                };
                var user = result[0] || false;
                if (user) 
                    var search_data = {
                        // Here we make dataset
                        _tag_to_replace_: 'replacement X y Z',
                        _display_new_form_:'none',
                        _user_first_: user.first,
                        _user_last_: user.last,
                        ...
                        ....
                        }
                return app.render('./profile.html', search_data);
```

Last line including `.render()` method, means: read `./profile.html`, then replace `'x-tag' in dataset` whit `dataset[x-tag]` value.  
Ok. Done. This Demo is very plain & pulp. I hope this will be helpful for you.
