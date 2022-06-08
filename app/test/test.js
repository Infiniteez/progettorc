const chai = require('chai');
const chaiHttp = require('chai-http');
const describe = require('mocha').describe;
const it = require('mocha').it;

const app = require('../app');

chai.use(chaiHttp);
chai.should();
describe('Test dell\'applicazione', () => {
	it('/ dovrebbe restituire 200 OK con un body', (done) => {
		chai.request(app)
			.get('/')
			.end((err, res) => {
				res.should.have.status(200);
				res.should.have.property('body');
				done();
			});
	});

	it('/test dovrebbe restituire 200 OK con body "Funziona"', (done) => {
		chai.request(app)
			.get('/test')
			.end((err, res) => {
				res.should.have.status(200);
				res.should.have.property('body');
				res.body.should.be.equal('Funziona');
				done();
			});
	});
});

describe('Test delle API dell\'applicazione', () => {
	it('Endpoint /api dovrebbe restituire 200 OK con body { api_working: true }', (done) => {
		chai.request(app)
			.get('/api')
			.end((err, res) => {
				res.should.have.status(200);
				res.should.have.property('body');
				res.body.should.be.equal(JSON.stringify({ api_working: true }));
				done();
			});
	});
});