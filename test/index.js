const chai = require('chai');
const r2base = require('r2base');
const r2mongoose = require('r2mongoose');
const r2inspector = require('../index');

const expect = chai.expect;
process.chdir(__dirname);

const app = r2base({ baseDir: __dirname });
app.start()
  .serve(r2mongoose, { database: 'r2test' })
  .serve(r2inspector)
  .load('model')
  .into(app);

const model = app.service('Mongoose').model('test');
const inspector = model.inspector;
const props = inspector.properties;

describe('r2inspector', () => {
  it('should create object', () => {
    expect(inspector.type).to.equal('object');
    expect(inspector.strict).to.equal(false);
    expect(inspector.optional).to.equal(false);
    expect(inspector.type).to.not.equal(undefined);
  });

  it('should create string', () => {
    expect(props.slug.type).to.equal('string');
    expect(props.slug.optional).to.equal(true);
    expect(props.slug.$cleanHtml).to.equal(true);
  });

  it('should create string, required', () => {
    expect(props.name.type).to.equal('string');
    expect(props.name.optional).to.equal(false);
    expect(props.name.$notEmpty).to.equal(true);
    expect(props.name.$cleanHtml).to.equal(true);
  });

  it('should create string, allowHtml', () => {
    expect(props.description.type).to.equal('string');
    expect(props.description.optional).to.equal(true);
  });

  it('should create string, pattern', () => {
    expect(props.email.type).to.equal('string');
    expect(props.email.optional).to.equal(true);
    expect(props.email.$cleanHtml).to.equal(true);
    expect(props.email.pattern).to.equal('email');
  });

  it('should create string, objectId', () => {
    expect(props.user.type).to.equal('string');
    expect(props.user.optional).to.equal(true);
    expect(props.user.$objectId).to.equal(true);
  });

  it('should create string, enum', () => {
    expect(props.isEnabled.type).to.equal('string');
    expect(props.isEnabled.optional).to.equal(true);
    expect(props.isEnabled.eq).to.deep.equal(['y', 'n']);
    expect(props.isEnabled.def).to.equal('n');
  });

  it('should create date', () => {
    expect(props.createdAt.type).to.equal('date');
    expect(props.createdAt.optional).to.equal(true);
  });

  it('should create number', () => {
    expect(props.workerCount.type).to.equal('number');
    expect(props.workerCount.optional).to.equal(true);
    expect(props.workerCount.lte).to.equal(1000);
    expect(props.workerCount.def).to.equal(0);
  });

  it('should create array', () => {
    expect(props.arr1.type).to.equal('array');
    expect(props.arr1.items.type).to.equal('string');
    expect(props.arr1.items.optional).to.equal(true);
    expect(props.arr1.items.$cleanHtml).to.equal(true);
  });

  it('should create array, item validation', () => {
    expect(props.arr2.type).to.equal('array');
    expect(props.arr2.items.type).to.equal('string');
    expect(props.arr2.items.optional).to.equal(true);
    expect(props.arr2.items.pattern).to.not.equal(undefined);
    expect(props.arr2.items.minLength).to.equal(2);
  });

  it('should create array, array validation', () => {
    expect(props.arr3.type).to.equal('array');
    expect(props.arr3.items.type).to.equal('string');
    expect(props.arr3.items.optional).to.equal(true);
    expect(props.arr3.maxLength).to.equal(8);
    expect(props.arr3.minLength).to.equal(2);
  });

  it('should create array, number, item validation', () => {
    expect(props.numsArr1.type).to.equal('array');
    expect(props.numsArr1.items.type).to.equal('number');
    expect(props.numsArr1.items.optional).to.equal(true);
    expect(props.numsArr1.items.lte).to.equal(100);
    expect(props.numsArr1.items.gte).to.equal(1);
  });

  it('should create array, number', () => {
    expect(props.numsArr2.type).to.equal('array');
    expect(props.numsArr2.items.type).to.equal('number');
    expect(props.numsArr2.items.optional).to.equal(true);
  });

  it('should create array, objectId', () => {
    expect(props.workers.type).to.equal('array');
    expect(props.workers.items.type).to.equal('string');
    expect(props.workers.items.optional).to.equal(true);
    expect(props.workers.items.$objectId).to.equal(true);
  });

  it('should create array of objects', () => {
    expect(props.votes.type).to.equal('array');
    expect(props.votes.items.type).to.equal('object');
    expect(props.votes.items.strict).to.equal(true);
    expect(props.votes.items.properties.user.type).to.equal('string');
    expect(props.votes.items.properties.user.optional).to.equal(true);
    expect(props.votes.items.properties.user.$objectId).to.equal(true);
    expect(props.votes.items.properties.type.type).to.equal('string');
    expect(props.votes.items.properties.type.optional).to.equal(true);
    expect(props.votes.items.properties.type.eq).to.deep.equal(['p', 'n']);
    expect(props.votes.minLength).to.equal(2);
    expect(props.votes.optional).to.equal(true);
  });

  it('should create nested object', () => {
    expect(props['links.web'].type).to.equal('string');
    expect(props['links.web'].optional).to.equal(true);
    expect(props['links.web'].$cleanHtml).to.equal(true);
    expect(props['links.web'].pattern).to.equal('url');
    expect(props.links.type).to.equal('object');
    expect(props.links.strict).to.equal(true);
    expect(props.links.optional).to.equal(true);
    expect(props.links.properties).to.not.equal(undefined);
    expect(props.links.properties.web.type).to.equal('string');
    expect(props.links.properties.web.optional).to.equal(true);
    expect(props.links.properties.web.$cleanHtml).to.equal(true);
    expect(props.links.properties.web.pattern).to.equal('url');
  });
});

function dropDatabase(done) {
  this.timeout(0);
  app.service('Mongoose').connection.db.dropDatabase();
  done();
}

after(dropDatabase);
