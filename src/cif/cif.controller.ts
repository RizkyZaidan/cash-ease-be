import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CifService } from './cif.service';
import { CreateUserDto } from './dto/create-users.dto';
import { UpdateUserDto } from './dto/update-users.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUsersDto } from './dto/get-users.dto';

@UseGuards(JwtAuthGuard)
@Controller('cif')
export class CifController {
  constructor(private readonly cifService: CifService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.cifService.create(createUserDto);
  }

  @Get()
  findAll(@Query() query: GetUsersDto) {
    return this.cifService.findAll(query.search, query.page, query.limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cifService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.cifService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cifService.remove(id);
  }
}
