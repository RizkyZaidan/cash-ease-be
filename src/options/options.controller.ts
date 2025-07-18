import { Controller, Get, Query } from '@nestjs/common';
import { GetOptionsDto } from './dto/get-options.dto';
import { OptionsService } from './options.service';

@Controller('options')
export class OptionsController {
  constructor(private readonly optionsService: OptionsService) {}

  @Get()
  findAll(@Query() query: GetOptionsDto) {
    return this.optionsService.findAll(query.id);
  }

}
