export function pickFieldsFromEntity<
    ReqType extends object,
    EntityType extends object,
    DtoType extends Partial<Record<string, any>>,
>(req: ReqType, entity: EntityType, fields: string[]): DtoType {
    const dto = {} as DtoType;

    for (const key of fields) {
        if ((req as any)[key] !== undefined) {
            dto[key as keyof DtoType] = (entity as any)[key];
        }
    }
    return dto;
}
