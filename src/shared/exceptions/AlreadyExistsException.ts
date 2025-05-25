export default class AlreadyExistsException extends Error {
  statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = "AlreadyExistsException";
    this.statusCode = 409;
  }
}

export class UsernameAlreadyExistsException extends AlreadyExistsException {
  constructor() {
    super("Username already exists");
  }
}

export class EmailAlreadyExistsException extends AlreadyExistsException {
  constructor() {
    super("Email already exists");
  }
}

export class PhoneNumberAlreadyExistsException extends AlreadyExistsException {
  constructor() {
    super("Phone number already exists");
  }
}