describe('Main TDD ', function() {

    before('mocking chrome global vars', function() {
      window.chrome = {
        storage: {
         sync: {} 
        }
      };
      var spy = sinon.stub(chrome.storage.sync, "get");

    it('Just making sure main application vars are set', function() {

      window.Steroids.should.not.be.undefined;
      window.Steroids.Models.should.not.be.undefined;
      window.Steroids.Collections.should.not.be.undefined;
      window.Steroids.Views.should.not.be.undefined;
      window.Steroids.Router.should.not.be.undefined;
      window.template.should.not.be.undefined;
      window.vent.should.not.be.undefined;

    });
    it('Checking the type of each object', function() {

      window.Steroids.should.be.a('object');
      window.template.should.be.a('function');
      window.vent.should.be.a('object');
    });

});