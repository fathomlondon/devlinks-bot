class BaseError extends Error {
	constructor(message) {
		super(message);
		this.name = this.constructor.name;
		Error.captureStackTrace(this, this.constructor);
	}
}

class UrlAlreadySubmittedError extends BaseError {
	constructor(message) {
		super(message || 'This url was already submitted previously.');
	}
}

module.exports = {
	UrlAlreadySubmittedError,
};
