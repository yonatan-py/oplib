Meteor.startup(function () {
	Deps.autorun(function () {
		if (Session.get("selected_lib")) {
			Meteor.subscribe("libbooks", Session.get("selected_lib"));
		}
	});
});

Meteor.subscribe("mylibs");
Meteor.subscribe("userinvites");
Meteor.subscribe("mybooks");

Template.main.libs = function () {
	// Meteor.subscribe("mylibs");
	var user = Meteor.user();
    if(!user)return;
    var user_libs = user.libs || [];
    return Libs.find(
//        {
//            _id:{
//                "$in": user_libs
//            }
//        }
    );
};
Template.main.books = function () {
	if(Session.get("selected_lib")){
//		console.log("Session get selected");
		// Meteor.subscribe("libbooks", Session.get("selected_lib")._id);
		var lib = Libs.findOne(Session.get("selected_lib"));
		return Books.find(
			{
			
				_id:{
					"$in": lib.books
				}
			}
		);

	}
	else{
		return [];
	}
	
};

Template.main.mybooks = function(){
	
		return Books.find(
			{
			
				holder: Meteor.userId()
			}
		);
	
}
Template.main.requests = function(){
	
		return Books.find(
					{
						holder: Meteor.userId(),
						queue: {$not:{$size: 0}}
					}
				);
	
}

Template.main.waitings = function(){
	if(!Meteor.user()) return;
	
	var waitings = Meteor.user().waitings || [];
	return Books.find(
		{
			_id:{
				$in: waitings
			}
		}
	);
}

Template.main.invites = function(){
	Meteor.subscribe("userinvites");
	//~ Meteor.subscribe("mylibs");
	var invites =  Invites.find();
	Meteor.subscribe("mylibs");
	return invites;
}

Template.main.selected_lib = function () {
	return Session.get("selected_lib");
};

Template.lib.selected = function () {
	if(Session.get("selected_lib")){
		return Session.get("selected_lib") == this._id ? "selected" : '';
	}
	else{
		return '';
	}
};



Template.invite.events(
	{
		'click button.accept': function(){
//			console.log(this);
			//~ Meteor.subscribe("mylibs");
			Meteor.call('accceptInvite', this, function(){});
			Meteor.subscribe("mylibs");
		}
	}
);

Template.book.waiting = function(){
	return this.queue.length;
}

Template.book.mine = function(){
    if(this.holder == Meteor.userId()) return true;
    return false;
}
Template.mybook.waiting = function(){
	return this.queue.length;
}

Template.request.waiting = function(){
	return this.queue.length;
}
Template.request.events({
	"button .passiton": function(){
		Meteor.call('passBookOn',this, function(){});
	}
});

Template.book.events({
	'click .order': function(){
		var queue = this.queue;
		//~ check if user is not in queue
		queue.push(Meteor.userId());
		Books.update(this._id,
			{
				"$set":{queue:queue}
			}
		);
        Meteor.call('orderBook', this);

    }
});

Template.tools.events(
	{
		'click button.addbook': function () {			
			if(!Session.get("selected_lib"))return;
			var lib_id = Session.get("selected_lib");
			var book_name = $('#book-name').val()
			Meteor.call('addBook',{lib_id: lib_id, book_name: book_name}, function(error){
				$('.lib.selected').click();
			});		
			
		},
		'click button.addlib': function () {
			console.log('add lib click')
			var lib_name = $('.lib-name').val();
			var admin = true;
			Meteor.call('addLib',
				{
					name: lib_name, 
					books:[], 
					users:[Meteor.userId()],
					admin: admin
				}, 
				function(error){}
			);		
			Meteor.subscribe("mylibs");
		},
		'click button.inviteuser': function(){
		Template.main.addinguser = false;
		var email = $('.user-email').val();
		Meteor.call('inviteUser',
			{
				email: email,
				lib: Session.get("selected_lib"),
				admin: true
			},
			function(error){
				console.log(error);
			}
		);
	}
	}
);

Template.main.events({
	
	
	
});


Template.lib.events({
	'click .removelib': function(event){
		event.stopImmediatePropagation();
		Libs.remove(this._id);
	},
	'click': function () {
		//~ Meteor.subscribe("libbooks").stop();
		// console.log('lib selected click');
		Session.set("selected_lib", this._id);      
		// Meteor.subscribe("libbooks", Session.get("selected_lib"));
	}
});

if(location.search.indexOf('invite') > -1){
	var q = location.search;
	var i = q.indexOf('=')
	var key = q.slice(i+1);
	Meteor.call('executeInvite',{key: key}, function(error){
		console.log(error);
	});
}
