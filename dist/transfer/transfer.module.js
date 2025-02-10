"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const transfer_service_1 = require("./transfer.service");
const transfer_controller_1 = require("./transfer.controller");
const transfer_entity_1 = require("./transfer.entity");
const axios_1 = require("@nestjs/axios");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const auth_module_1 = require("../auth/auth.module");
const user_entity_1 = require("../users/user.entity");
let TransferModule = class TransferModule {
};
exports.TransferModule = TransferModule;
exports.TransferModule = TransferModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([transfer_entity_1.Transfer, user_entity_1.User]),
            axios_1.HttpModule,
            jwt_1.JwtModule.register({}),
            config_1.ConfigModule,
            auth_module_1.AuthModule,
        ],
        controllers: [transfer_controller_1.TransferController],
        providers: [transfer_service_1.TransferService],
        exports: [transfer_service_1.TransferService],
    })
], TransferModule);
//# sourceMappingURL=transfer.module.js.map