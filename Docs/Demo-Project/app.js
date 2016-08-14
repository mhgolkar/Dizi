//
//  Dizi Demo Project
//  Open Adress Book
//

// var dz = require('dizi');
// or if is installed manually:
var Dizi = require('../../Dizi.js');

var app = new Dizi();
app.folder = './media';
app.public = ['media'];
var db = app.jodo('./data.json');

// Server Handler
// All App in Single Function
var handler = function(ipr){
    //console.log(ipr.post);
    var home_dataset = {
        display_login: 'block',
        display_wellcome : 'none',
        alert:' ',
        _recent_users_length_: db.configs.recent,
        _all_users_count_: db.users.length,
        green_alert : " "
    };
    switch( ipr.target ){
    // The Page Which is Requested (Form Action)
        case 'logout':
            if(ipr.session) ipr.session.exit();
            break;
        case 'log':
            if(ipr.post.username && ipr.post.password){
                //check for username and password
                var user = db.users.any('user','==', ipr.post.username, true)[0];
                if(user.pass == ipr.post.password){
                    // Ok make session
                    ipr.session.sign(ipr.post.username, user);
                } else {
                    home_dataset['alert'] = 'wrong username or password';
                }
            }
            break;
        case 'edit':
            if(ipr.post.fields){
                // Edit Profile
                var fields = ipr.post.fields;
                if(fields.new_pass && fields.new_pass_c == ipr.session.data.pass && fields.new_pass.length>1){
                    // change password
                    var newpass = fields.new_pass || null;
                }
                if(ipr.post.files.length>0){
                    // change password
                    var newimg = require('path').relative(app.root, ipr.post.files[0].save());
                }
                var new_user = {
                    user: ipr.session.id,
                    pass: newpass || ipr.session.data.pass,
                    first: fields.first,
                    last: fields.last,
                    image: newimg || null, 
                    mail: fields.mail,
                    birth: fields.birth,
                    page: fields.page,
                    phone: fields.phone,
                    adress: fields.adress,
                    more: fields.more
                };
                db.users[parseInt(ipr.session.data.id) - 1] = new_user;
                ipr.session.set(new_user);
                // You Can Save Changes :
                // db.save();
            }
            if(ipr.session.isActive()){
            // Templating
                var user = ipr.session.data;
                var edit_dataset = {
                    '_display_new_form_':'none',
                    'alert':' ',
                    '_display_edit_form_':'block',
                    '_display_info_':'none',
                    '_display_change_pass_':'block',
                    _user_img_: user.image,
                    _user_name_: user.first + " "  + user.last ,
                    _user_user_: ipr.session.id ,
                    _user_first_: user.first,
                    _user_last_: user.last,
                    _user_mail_: user.mail,
                    _user_birth_: user.birth,
                    _user_page_: user.page,
                    _user_phone_: user.phone,
                    _user_adress_: user.adress,
                    _user_more_: user.more
                }
                return app.render('./profile.html', edit_dataset);
            }
            break;
        case 'search':
            if('n' in ipr.query){
                var result = db.users.any('first', ipr.query.n, true);
                if (result.length>1){
                   result = app.jodo(result).any('last', ipr.query.l, true) || null;
                };
                var user = result[0] || false;
                if (user) var search_data = {
                    _display_new_form_:'none',
                    alert:' ',
                    _display_edit_form_:'none',
                    _display_info_:'block',
                    _display_change_pass_:'none',
                    _user_img_: user.image,
                    _user_name_: user.first + " "  + user.last ,
                    _user_user_: "----" ,
                    _user_first_: user.first,
                    _user_last_: user.last,
                    _user_mail_: user.mail,
                    _user_birth_: user.birth,
                    _user_page_: user.page,
                    _user_phone_: user.phone,
                    _user_adress_: user.adress,
                    _user_more_: user.more
                };
                return app.render('./profile.html', search_data);
            } else if('what' in ipr.post){
                return "Not Completed";
            }
            break;
    };
    // making recently signed user list:
    var rc_list = "";
    for(var c = db.users.length-1; c >= (db.users.length - db.configs.recent); c--){
        rc_list +=
            "<li>"+
            "<a href='/search?n="+db.users[c].first+"&l="+ db.users[c].last+"'>"
                + db.users[c].first + " " + db.users[c].last 
            +"</a>"
            +"</li>\n";
    };
    home_dataset['_recent_users_o_list_'] = rc_list;
    if(ipr.session.isActive() == 1){
        home_dataset['display_login'] = 'none';
        home_dataset['display_wellcome'] = 'block';
        home_dataset['_user_name_'] = ipr.session.id;
        home_dataset['_user_img_'] = ipr.session.data.image || null;
    }
    return app.render('./index.html', home_dataset);
};

app.createServer(handler, 80)
console.log('Dizi Open Adress Book is Alive [localhost:80]');
