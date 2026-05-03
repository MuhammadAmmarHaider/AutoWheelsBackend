import { AuthGuard } from "@nestjs/passport";
// Custom JWT authentication guard that extends the built-in AuthGuard from Passport, using the 'jwt' strategy to protect routes and ensure that only authenticated users can access certain endpoints
export class JwtGuard extends AuthGuard('jwt'){
    constructor(){
        super();
    }
}

