/*
//  Post-Install TEST SCRIPT FOR Dizi Package
//  __________________________________________
//    ____  __  ____  __  
//   (    \(  )(__  )(  ) 
//    ) D ( )(  / _/  )(  
//   (____/(__)(____)(__) 
//  __________________________________________
//  NodeJs Framework for Retro Web Development
//  ------------------------------------------
//  Dizi
//  1.0.0
//  Morteza H. Golkar
//  License: MIT
*/

'use strict';
//  DRY
const magenta = '\x1b[35m';
const cyan = '\x1b[36m';
const red = '\x1b[31m';
const yellow = '\x1b[33m';
const reset = '\x1b[0m';
const log = console.log;
const full = 10; var stat = 10;

// Info
    log(cyan, "\n",
        ".------------------------------------.\n",
        "|               Dizi                 |\n",
        ".------------------------------------.\n",
        "|              v.1.0.0               |\n",
        "|          Morteza H. Golkar         |\n",
        "|            License: MIT            |\n",
        "`------------------------------------`\n");

// 01.
// Init Dizi
log(magenta, ">> Testing 'Dizi v1.0.0' Framework >>", reset);
const Dizi = require('dizi');
var dz = new Dizi() || false;
if(dz && dz.root) log(" 01. Dizi is Installed... \n\t Was Required & Result Seems [OK].");
    else {
        log(yellow, "01. Unable to Use Dizi\n\t", red, ">> require('dizi') >> Faild");
        process.abort();
    };

// Testing Functionalities
// 02. Jodo Databese
log(" 02. Built-in Flat File Database");
var test_db = dz.jodo({
    users: {
        persians:{
            nakhalaf:{age:27},
            harumzade:{age:35}
        },
        americans:{
            john:{age:50},
            jason:{age:40},
            jack:{age:12},
            jane:{age:9}
        }
    },
    That: {age:99}
});
var test_result = test_db.users.americans.any("age",">","20");
if(typeof test_db == 'object' && test_result.john.age == 50) log(" >> JavaScript Object Database Operator >> \n\t Jodo [OK]. ");
    else { log(yellow, "\t >> Jodo >> ", red, "Failed"); stat--};

// 03. Router Function
log(" 03. Routing");
dz.route("x","y");
if(dz.router && dz.router['x']=='y') log(" 'x' to 'y' >> [OK].");
    else { log(yellow, ">> Unable to Route >> \n\t", red, "Router Failed"); stat--};

// 04. Rendering
log(" 04. Rendering");
var test_html = dz.render("%tag1%%tag2%%tag1%",{tag1:11, tag2:12});
if(dz.render && test_html === "111211") log(" >> Test with Multiple Tags >> [OK].");
    else { log(yellow, ">> Wrong Rendering >> \n\t", red, "Render Function Failed"); stat--};

// 05. Parser
log(" 05. Parser (Get and Post Requests) \n\t (Multi/form-data, Base64, Text, JSON ...)");
try { dz.parse()} catch(x){
    var test_msg = x.message.toLowerCase();
} finally {
if(test_msg.indexOf("wrong input on parsing request") !== -1) log(" \t >> Parser Works >> [OK].");
    else { log(yellow, "\t >> Parser Function >>", red, " Failed "); stat--};
};

// 06. Server
log(" 06. Http Server");
dz.timeout = 123456;
var test_server = dz.createServer(function(){});
if(test_server.timeout == 123456) log(" >> Timeout and Server Handling >> [OK].");
    else { log(yellow, ">> Unable to Create Server >> \n\t", red, "Http Server Handling Failed"); stat--};

// 07. Sessioning
log(" 07. Sessioning");
dz.sessioning.sign("sezar","coin");
var ses = dz.sessioning.store[dz.sessioning.index['sezar']];
if(typeof ses == 'object' && ses.data == 'coin') log(" >> Ready to Sessioning >> [OK].");
    else { log(yellow, ">> Unable to Sessioning >> ", red, "[Failed]"); stat--};

// is Ready?
log(magenta, "Test Done.");
log(stat == 10 ? yellow : red, ">> Dizi is " + stat/full*100 + " % Ready.");
log(reset);
process.exit(0);