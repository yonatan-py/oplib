Libs = new Meteor.Collection("libs");
Books = new Meteor.Collection("books");
Invites = new Meteor.Collection("invites");

Libs.allow({
    insert: function (userId, lib) {
        console.log('libs.allow.insert');
        if(userId)
			return true; 
		return false;
    },
    update: function (userId, lib, fields, modifier) {
        if(userId)
			return true; 
		return false;
    },
    remove: function (userId, lib) {
        return true;
        var user = Meteor.user();
        if(user.admin_libs.indexOf(lib._id)>0) return true;
        return false;
    }
});

Books.allow({
	update: function(){
		return true;
	}
});
