import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

export interface HealthStatus {
  service: "rulivo-api";
  status: "ok";
}

@ApiTags("system")
@Controller("health")
export class HealthController {
  @Get()
  @ApiOperation({ summary: "Check API health" })
  @ApiOkResponse({
    description: "The API process is healthy"
  })
  public getHealth(): HealthStatus {
    return {
      service: "rulivo-api",
      status: "ok"
    };
  }
}
