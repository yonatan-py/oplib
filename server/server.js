Meteor.publish("mylibs", function () {
//	console.log("mylibs - published");
	if(!this.userId) return;
	var user = Meteor.users.findOne(this.userId);
//    console.log(user.profile.name);
	var user_libs = user.libs || [];
//    console.log(user_libs);
	var libs = Libs.find(
		{
			_id:{
				"$in": user_libs
			}
		}
	);
//	console.log(libs.fetch());
	return libs;
});

Meteor.publish("libbooks", function (lib_id) {
//	console.log("libbooks - published");
//	console.log(lib_id);
	var lib = Libs.findOne(lib_id);
	var books = Books.find(
		{
			_id:{
				"$in": lib.books
			}
		}
	);
//	console.log('books');
//	console.log(books.fetch());
	return books;
});
Meteor.publish("mybooks", function () {
	if(!this.userId) return;
	var books = Books.find(
		{
			holder: this.userId
		}
	);
//	console.log('books');
//	console.log(books.fetch());
	return books;
});

Meteor.publish("userinvites", function(){
//	console.log('userinvites - published');
	if(!this.userId) return;
	var user = Meteor.users.findOne(this.userId);
	var email = user.services.google.email;
	var invites = Invites.find(
		{
			email: email
		}
	);
	return invites;
});

Meteor.methods({
	addBook: function(options){
//		console.log('add book');
//		console.log(options)
		var user = Meteor.user();
//		console.log('user:   '+user.profile.name);
		var user_books = user.books || [];
//		console.log('user books:	'+user_books);
		
		var book_name = options.book_name;
		var lib_id = options.lib_id;
		lib = Libs.findOne(lib_id);
		var lib_books = lib.books;
		var book = {name: book_name, holder: user._id, queue:[]}
		book_id = Books.insert(book);
		lib_books.push(book_id);
		user_books.push(book_id);
		console.log('libs books length:	' + lib_books.length);
		console.log('user books length:	' + user_books.length);
		Libs.update(lib_id,{"$set": {books: lib_books}});
		Meteor.users.update(user._id, {"$set":{books:user_books}})
	},
    myBooks: function(){
		return Books.find(
			{holder: Meteor.userId()}
		);
	},
    myLibs: function () {
        
        console.log('myLibs - server');
        //~ console.log(Meteor.user())
        //~ console.log(Meteor.userId())
        var user = Meteor.user();
        if(!user) {
			console.log('!user');
			return [];
		}
		else{
			console.log('user is');
		}
		if(!user.libs) {
			console.log('!user.libs');
			return [];
		}
        
        var libs = user.libs;
        if(libs){
			
			var my_libs = Libs.find().fetch()
				.filter(
					function(lib){
						if(user.libs &&  user.libs.indexOf(lib._id) > -1){
							return true;
						}
						return false;
					})
				.map(
					function(lib){
						if(user.admin_libs &&  user.admin_libs.indexOf(lib._id) > -1){
							lib.admin = true;
						}
					else{
						lib.admin = false;
					}
					return lib;
				});
			//~ console.log('----------my libs --------');
			//~ console.log(my_libs);
			return my_libs;
		}
		return [];
		
    },
    addLib: function(options){
	    console.log('addLib');
	    //~ console.log(options);
	    //~ console.log(Libs.find().fetch());
	    var lib_id = Libs.insert(
			{
				name: options.name,
				users: options.users,
				books: options.books
			}
	    );
	    //~ console.log(Libs.find().fetch());
		
	    
	    //~ var lib_id = options.lib_id;
	    var user = Meteor.user();
	    //~ console.log('user:	' + user.profile.name)
	    var libs = user.libs || [];
	    //~ console.log('user_libs:	'+ libs)
	    var admin_libs = user.admin_libs || [];
	    console.log('admin_libs:	'+ admin_libs)
	    libs.push(lib_id);
	    admin_libs.push(lib_id);
	    
	    Meteor.users.update(Meteor.userId(),
			{
				"$set": {
						libs: libs,
						admin_libs: admin_libs
				}
			}
		);
		//~ console.log(Meteor.user())
		
	},
	inviteUser: function(options){
		console.log('inviteUser');
		console.log('email	' +options.email);
		console.log('lib	' +options.lib);
		console.log('admin	' +options.admin);
		

		var invite = Invites.insert(
			{
				from: Meteor.user().services.google.email,
				email: options.email,
				lib: options.lib,
				admin: options.admin
			}
		);
	},
	executeInvite: function(options){
		var key = options.key;
		var invite = Invites.findOne({key: key});
		var lib = invite.lib;
		var user = Meteor.user();
	    var libs = user.libs || [];
	    libs.push(lib);
	    Meteor.users.update(user._id,{"$set": {libs: libs}})
	    if(invite.admin){
			var admin_libs = user.admin_libs || [];
			admin_libs.push(lib);
			Meteor.users.update(user._id,{"$set": {admin_libs: admin_libs}})
		}
	},
	removeLib: function(options){
		Libs.remove(options.lib_id);
	},
	accceptInvite:function(invite){
		console.log('acceptInvite');
		var user = Meteor.user();
		var lib = Libs.findOne(invite.lib);
		var lib_users = lib.users || [];
		lib_users.push(user._id);
		var user_libs = user.libs || [];
		user_libs.push(lib._id);
		Libs.update(lib._id,{"$set":{user: lib_users}})
		Meteor.users.update(user._id,{"$set":{libs: user_libs}})
		
		if(invite.admin){
			console.log('and make admin');
		};
		Invites.remove(invite._id);
	},
	passBookOn: function(book){
		//~ change book status.
		Books.update(book._id,{$set:{status: 'released'}});
		//~ notify first in queue
		var user = Meteor.user();
		var waiting = user.waiting || [];
		waiting.push(book._id);
		Meteor.user.update(user._id, {$set:{waiting: waiting}});
	},
    orderBook: function(book){
//        console.log('orderBook');
//        console.log(book);
        var user = Meteor.user();
//        console.log(user.profile.name)
        var waitings = user.waitings || [];
//        console.log(waitings);
//        waitings.push(book._id);
        Meteor.users.update(user._id,
                                        {
                                            "$set":
                                            {
                                                "waitings":waitings
                                            }
                                        }
                            );
//        console.log(Meteor.user())
    }
});

