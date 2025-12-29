import { IsEnum } from "class-validator";
import { Skill } from "../../shared-config";

export class CreateConsultantDto {
  @IsEnum(Skill)
  skill: Skill;
}
