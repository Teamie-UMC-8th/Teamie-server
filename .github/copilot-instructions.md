When performing a code review, respond in Korean.

When performing a code review, flag any function whose cyclomatic complexity exceeds 10 and propose refactoring.

When performing a code review, recommend extracting shared logic into utility functions when code duplication exceeds 3 lines.

# --- 코드 식별자 철자 검사 --------------------------------------------

When performing a code review, flag likely typos in identifiers (variables, functions, classes) and suggest corrections, while ignoring words present in an approved allow-list (e.g., domain terms, acronyms).

# --- 팀 전용 컨벤션 --------------------------------------------

When performing a code review, before merge make sure `npm run format` (Prettier) has been executed and no files are left unformatted.

When performing a code review, reject or flag any file whose name is not in kebab-case.

When performing a code review, ensure only one decorator is used per line (no stacked decorators).

When performing a code review, prefer plural naming for identifiers unless a singular form is semantically required.

# 데코레이터 배치 규칙
When performing a code review, enforce that @Transactional() is placed:
1) directly above the method declaration,
2) immediately above HTTP method decorators such as @Get, @Post, etc.,
3) after every other decorator.

# NestJS Controller decorator ordering (closest to the method first)
When performing a code review, verify decorator order on controller methods is:
1) API method decorators (e.g., @Get, @Post),
2) Interceptors,
3) Pipes,
4) Miscellaneous decorators (e.g., Swagger annotations).

# Controller parameter ordering
When performing a code review, enforce parameter order in controller handlers as:
1) @Req or similar request object,
2) @User or authentication principal,
3) @Param,
4) @Body,
5) any others.
