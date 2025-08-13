import { portfolioType } from 'src/common/enums/portfolio-type.enum';
import { PersonalRecall } from 'src/modules/personal-recalls/entities/personal-recalls.entity';

export interface ProjectData {
    userName: string;
    role: string;
    projectName: string;
    projectPeriod: string;
    category: portfolioType;
    contributionRate: number;
    records: Array<{ name: string; meetingRecords: string }>;
    tasks: Array<{ name: string }>;
    personalRecall: PersonalRecall | null;
}
