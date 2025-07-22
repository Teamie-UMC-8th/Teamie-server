import { promises as fs } from 'fs';
import { join } from 'path';

export class PromptLoader {
    private readonly basePath: string = join(__dirname, '../prompts');

    async load(fileName: string): Promise<string> {
        const filePath = join(this.basePath, fileName);
        return fs.readFile(filePath, 'utf-8');
    }
}
