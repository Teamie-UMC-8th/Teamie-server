import { Injectable } from '@nestjs/common';
import { UserProjectRepository } from '../user-projects/repositories/user-project.repository';
import { UserProject } from '../user-projects/entities/user-projects.entity';
import { QueryRunner } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { projectPermission } from 'src/common/enums/project-permission.enum';
import { PersonalRecall } from 'src/modules/personal-recalls/entities/personal-recalls.entity';
import { Status } from 'src/common/enums/status.enum';
import { Step } from 'src/modules/steps/entities/steps.entity';
import { Task } from 'src/modules/tasks/entities/tasks.entity';
import { Manager } from 'src/modules/tasks/entities/managers.entity';
import { Plan } from 'src/modules/plans/entities/plan.entity';
import { Attendee } from 'src/modules/plans/entities/attendees.entity';
import { Writer } from 'src/modules/plans/entities/writers.entity';

export const dashboardData = {
    //NOTE: 스텝6개&업무20개
    steps: [
        {
            name: '회장단 보고',
            tasks: [
                {
                    name: '기획국 연간 활동계획안 작성',
                    deadline: '2025-08-13 23:59:59',
                    status: Status.COMPLETED,
                    memo: '',
                    manager: true,
                },
                {
                    name: '기획국 하반기 결산보고안 작성',
                    deadline: '2026-01-07 23:59:59',
                    status: Status.ONGOING,
                    memo: '',
                    manager: true,
                },
                {
                    name: '2024 기획국 운영보고자료 작성',
                    deadline: '2026-01-31 23:59:59',
                    status: Status.NOTSTART,
                    memo: '',
                    manager: true,
                },
            ],
        },
        {
            name: '9월 정기모임',
            tasks: [
                {
                    name: '9월 정기모임 운영계획안 작성',
                    deadline: '2025-08-23 23:59:59',
                    status: Status.COMPLETED,
                    memo: '',
                    manager: true,
                },
                {
                    name: '9월 정기모임 운영 공지',
                    deadline: '2025-09-01 23:59:59',
                    status: Status.ONGOING,
                    memo: '단체 카톡방에 메세지와 참여 신청 form 공유 예정입니다.',
                    manager: true,
                },
                {
                    name: '9월 정기모임 회계 처리',
                    deadline: '2025-09-20 23:59:59',
                    status: Status.NOTSTART,
                    memo: '',
                    manager: true,
                },
                {
                    name: '9월 정기모임 피드백 정리',
                    deadline: '2025-09-20 23:59:59',
                    status: Status.NOTSTART,
                    memo: '',
                    manager: true,
                },
            ],
        },
        {
            name: '가을 특별행사',
            tasks: [
                {
                    name: '가을행사 운영기획안 작성',
                    deadline: '2025-09-13 23:59:59',
                    status: Status.ONGOING,
                    memo: '',
                    manager: true,
                },
                {
                    name: '가을행사 운영 공지',
                    deadline: '2025-09-28 23:59:59',
                    status: Status.NOTSTART,
                    memo: '',
                    manager: true,
                },
                {
                    name: '가을행사 회계 처리',
                    deadline: '2025-10-31 23:59:59',
                    status: Status.NOTSTART,
                    memo: '',
                    manager: true,
                },
                {
                    name: '가을행사 피드백 정리',
                    deadline: '2025-10-31 23:59:59',
                    status: Status.NOTSTART,
                    memo: '',
                    manager: true,
                },
            ],
        },
        {
            name: '10월 정기모임',
            tasks: [
                {
                    name: '10월 정기모임 운영기획안 작성',
                    deadline: '2025-09-27 23:59:59',
                    status: Status.NOTSTART,
                    memo: '',
                    manager: false,
                },
                {
                    name: '10월 정기모임 운영 공지',
                    deadline: '2025-10-01 23:59:59',
                    status: Status.NOTSTART,
                    memo: '',
                    manager: false,
                },
                {
                    name: '10월 정기모임 회계 처리',
                    deadline: '2025-10-31 23:59:59',
                    status: Status.NOTSTART,
                    memo: '',
                    manager: true,
                },
                {
                    name: '10월 정기모임 피드백 정리',
                    deadline: '2025-10-31 23:59:59',
                    status: Status.NOTSTART,
                    memo: '',
                    manager: false,
                },
            ],
        },
        {
            name: '11월 정기모임',
            tasks: [
                {
                    name: '11월 정기모임 회계처리',
                    deadline: '2025-11-15 23:59:59',
                    status: Status.NOTSTART,
                    memo: '',
                    manager: true,
                },
            ],
        },
        {
            name: '12월 정기모임',
            tasks: [
                {
                    name: '12월 정기모임 운영기획안 작성',
                    deadline: '2025-11-20 23:59:59',
                    status: Status.NOTSTART,
                    memo: '',
                    manager: true,
                },
                {
                    name: '12월 정기모임 운영 공지',
                    deadline: '2025-12-01 23:59:59',
                    status: Status.NOTSTART,
                    memo: '',
                    manager: true,
                },
                {
                    name: '12월 정기모임 회계 처리',
                    deadline: '2025-12-26 23:59:59',
                    status: Status.NOTSTART,
                    memo: '',
                    manager: true,
                },
                {
                    name: '12월 정기모임 피드백 정리',
                    deadline: '2025-12-29 23:59:59',
                    status: Status.NOTSTART,
                    memo: '',
                    manager: true,
                },
            ],
        },
    ],
};

export const planData = [
    //NOTE: 일정16개
    {
        name: '기획국 1차 정기회의',
        date: '2025-08-17 00:00:00',
        location: '303관 108호',
        startHour: '17:00:00',
        meetingRecords: `1. 개회
회의 목적 안내
동아리원 간 언어교환을 통해 실질적 관계 형성을 지원하고, 학습 환경을 조성하는 목표 공유
평균 행사 참여율 120% 달성, ‘매우 만족’ 피드백 70% 이상, 회원 유지율 25% 목표 제시

2. 역할 및 일정 분담 확인

김수빈
정기모임 운영 총괄 및 분기별 특별행사 총괄
모든 예산 관리 및 최종 회계 처리

최땡땡
정기모임 운영 총괄

박땡땡
정기모임 운영 총괄

3. 예산 관리 방안 논의

연간 예산 총액 및 분배 기준 설명(정기모임 운영비 vs 특별행사 운영비)
전산장부 활용한 실시간 지출 기록 절차 도입
매 모임 종료 후 3일 이내 지출 내역 제출 및 기획국장에게 전달

4. 운영 프로세스 및 참여 원칙

정기모임 운영 절차
각 총괄 담당자가 운영계획서 작성
기획국 정기회의에서 계획서 피드백 및 수정·확정
확정된 운영안 공지 후 실행
행사 종료 후 정산 자료 취합 및 기획국장에게 전달
기획국장이 회계 처리

참여 원칙: 모든 공식 행사에 기획국원 필수 참여`,
        writer: true,
        attendee: true,
    },
    {
        name: '연간 활동계획보고',
        date: '2025-08-15 14:59:00',
        location: '310관 602호',
        memo: '',
        startHour: '16:00:00',
        meetingRecords: `1. 개회
회장단의 2025년 동아리 운영 방향성 공유
회원 참여 확대와 안정적 운영 기반 마련
내·외부 협력 강화 및 콘텐츠 다양성 확보
오늘 논의할 연간활동계획 및 예산안 보고 일정 확인

2. 연간활동계획 보고
2.1 기획국 계획 발표
정기모임: 월 1회 진행 (매월 둘째 주 금요일 예정, 변동가능)
특별 행사: 분기별 1회 진행 (4월, 7월, 10월, 1월 예정)
예산 계획: 정기모임 운영비 연 600만 원, 분기 행사별 300만 원 배정

2.2 홍보국 계획 발표
SNS 운영: 페이스북·인스타그램 주 2회 게시
콘텐츠 제작: 월별 행사 포스터·홍보 영상 기획
성과 목표: 팔로워 1,000명 달성, 게시물 평균 상호작용률 5%

2.3 대외협력국 계획 발표
언어교환 파트너: 6곳 신규 발굴(어학원 3, 국제 교류 센터 3)
기업 후원: 후원사 2곳 확보 목표(어학 앱, 출판사 등)
계약 관리: 후원 조건·홍보 채널별 스폰서십 패키지 운영

3. 종합 논의 및 일정 조율
8월 중 상반기 결산보고 진행
2월 중 2024 운영보고 진행`,
        writer: false,
        attendee: true,
    },
    {
        name: '기획국 8차 정기회의',
        date: '2025-11-23 14:59:00',
        location: '중앙대 앞 할리스 3층',
        startHour: '19:30:00',
        meetingRecords: '',
        writer: false,
        attendee: false,
    },
    {
        name: '기획국 2차 정기회의',
        date: '2025-08-31 00:00:00',
        location: '',
        memo: '',
        startHour: '18:00:00',
        meetingRecords: `9월 정기모임과 OX 퀴즈 이벤트 사이의 연결을 살리기 위해 가을 특별활동 테마는 ‘내가 직접 만든 OX 퀴즈’로 설정. 참가자들이 각자 문제를 하나씩 만들어와 팀끼리 내는 활동 방식으로 진행하기로 함.

최땡땡이 퀴즈 템플릿 활동지를 초안으로 만들고, 김수빈은 참여자들에게 사전 제출을 받을 수 있는 구글폼을 제작.

단순 퀴즈 외에도, 퀴즈에 관련된 짧은 설명을 함께 공유하게 해 서로의 문화적 배경이나 관점을 더 깊게 이해할 수 있도록 설계함.

공간은 기존과 동일하게 대여 확정, 최땡땡이 음향 및 좌석배치 리허설 확인까지 맡기로 함.

지난 행사 때 사용한 BGM 리스트 중 반응 좋았던 곡 일부를 재활용해 친숙한 분위기를 만들기로 했다.

종료 후 사진을 따로 정리하여 인스타 릴스 콘텐츠로 활용 가능성도 논의함. 김수빈이 홍보국과 논의 후 파일 전달 예정`,
        writer: false,
        attendee: true,
    },
    {
        name: '기획국 3차 정기회의',
        date: '2025-09-14 14:59:00',
        startHour: '20:00:00',
        meetingRecords: `10월 정기모임의 테마는 "첫 만남, 나의 언어 취향 찾기"로 정함. 초급자 배려를 위해 활동 난이도는 낮추기로 함.

최땡땡이 활동지 초안 구성. 지난 모임과의 연결성을 위해 음식 관련 표현 사용 유도 예정. 빙고 게임, 말풍선 인터뷰, 첫 언어교환 경험 공유 등의 활동으로 구성됨.
김수빈은 진행 흐름에 맞는 시간 분배와 멘트 초안 작성 담당.
참여자 접수 시, 성향 기반 조 편성을 위한 사전 설문 설계도 함께 진행함.

모임 종료 후 바로 피드백 수합해 다음 회차 반영 예정.`,
        writer: true,
        attendee: true,
    },
    {
        name: '기획국 4차 정기회의',
        date: '2025-09-28 14:59:00',
        startHour: '18:00:00',
        meetingRecords: `9월 정기모임에서 진행했던 “상황별 회화” 활동에 대해 전반적으로 반응이 좋았지만, 초급 참여자들이 어려워하는 부분이 있었다는 피드백을 바탕으로 난이도 구간을 나누는 방안을 논의함

최땡땡은 초급용/중급용 활동지를 별도로 구성하기로 했고, 김일번은 조 편성 시 사전 난이도 선호를 반영하는 시스템을 시트에 추가하기로 함.
테마는 ‘내가 겪은 문화 충격’으로 결정. 문화적 차이를 다뤄 대화가 자연스럽게 확장되도록 유도할 계획.
오프닝 아이스브레이킹으로는 '이해할 수 없는 외국 문화 OX 퀴즈'를 넣고, 김땡땡이 문제 5개를 준비하기로 함.

활동 시간은 총 60분, 전체 운영 시간은 기존과 동일하게 유지하되 발표 시간은 없애고 피드백지로 대체.

회의 말미에는 기말고사 시즌을 고려해 리마인더 메시지 문구를 간단하고 유쾌하게 구성하기로 했다.`,
        writer: true,
        attendee: true,
    },
    {
        name: '기획국 7차 정기회의',
        date: '2025-11-09 14:59:00',
        startHour: '16:00:00',
        writer: false,
        attendee: false,
    },
    {
        name: '기획국 9차 정기회의',
        date: '2025-12-07 14:59:00',
        startHour: '17:00:00',
        writer: false,
        attendee: false,
    },
    {
        name: '기획국 10차 정기회의',
        date: '2025-12-21 14:59:00',
        location: '303관 102호',
        startHour: '19:00:00',
        meetingRecords: `1월 정기모임은 겨울 특별행사와의 분위기 연결을 고려해 ‘나의 언어 키워드’를 주제로 설정. 활동을 통해 배운 표현 중 가장 기억에 남는 단어, 말투, 문장 등을 돌아보는 활동 중심으로 기획됨.

김수빈은 활동지 기본 프레임을 제시했고, 최땡땡이 여기에 짧은 리플렉션 질문을 추가해 회고 느낌을 강화하기로 함.
아이스브레이킹은 ‘올해 배운 단어로 이력서 쓰기’ 미션. 웃음을 유도할 수 있는 요소로 기대됨.
참여자 조 편성 시 모든 인원이 섞이도록 김일번이 조정 예정.
봄 특별행사와 연계할 포토존 장식 아이디어도 간단히 논의. 홍보국 협력 필요
마지막으로, 김수빈이 활동 종료 후 사용할 후기 서식 문구 초안을 정리해두기로 함.`,
        writer: true,
        attendee: false,
    },
    {
        name: '기획국 6차 정기회의',
        date: '2025-10-26 14:59:00',
        startHour: '18:00:00',
        meetingRecords: `11월 정기모임 주제는 ‘언어 교환 X 퀴즈의 밤’으로 확정. 다양한 언어 기반 퀴즈(속담 맞히기, 동시 통역, 발음 듣고 의미 맞히기 등) 구성하기로 함.
퀴즈 방식은 소규모 팀 대항전 형태로 운영. 조 편성 기준은 사전 설문 결과에 따라 결정 예정.

공간 후보로 카페형 대관 공간이 제안되었고, 최땡땡이 예약 가능 여부 확인 중. 김일번은 시간대 및 예산 확인 예정.

상품은 기프티콘 외에도 자체 굿즈(포스트잇, 스티커 등) 검토 중. 굿즈 디자인 시안은 다음 회의 전까지 최땡땡이 공유하기로 함.

문제 출제 및 리허설은 총 3회 예정. 1차 문제 초안은 최땡땡이, 검토 및 편집은 김일번이 맡기로 역할 분담.
행사 흐름 및 사회자 멘트, 오프닝 순서도 최땡땡이 초안 작성 후 협의하기로 함.
김일번이 홍보국에 홍보 요청 예정`,
        writer: true,
        attendee: true,
    },
    {
        name: '기획국 5차 정기회의',
        date: '2025-10-12 14:59:00',
        location: '중앙대 앞 스타벅스',
        startHour: '17:00:00',
        meetingRecords: `지난 정기모임 피드백 논의. 초급자 전용 시간대 도입이 긍정적 평가를 받았으며, 활동지 분량을 늘린 것도 만족도 상승에 기여.

김수빈은 전체 흐름의 유연성을 위해 오프닝 멘트를 간결화하고, 상황별 대처용 안내문(영어/한글)을 추가하자고 제안.
최땡땡은 피드백 항목을 더 정제해 익명 폼으로 전환할 것을 제안, 이에 따라 다음 정기모임 종료 후 바로 시범 적용해보기로 함.

겨울 특별행사는 ‘ 언어 여행 회고’라는 콘셉트로 정리. 참가자 각자가 기억에 남는 표현, 뉘앙스, 에피소드를 공유하는 자리를 마련하기로 함.
회고 분위기를 살리기 위해 김수빈이 BGM과 장식 콘셉트를 정하고, 최땡땡은 공유용 리캡 콘텐츠(사진 및 자막 포함 영상) 기획 담당.

해당 행사는 연말 분위기를 반영한 소규모 오픈마이크 형식도 고려하기로 함.`,
        writer: true,
        attendee: true,
    },
    {
        name: '9월 정기모임',
        date: '2025-09-15 00:00:00',
        location: '공덕 프론트원',
        startHour: '16:00:00',
        writer: false,
        attendee: true,
    },
    {
        name: '10월 정기모임',
        date: '2025-10-13 00:00:00',
        startHour: '16:00:00',
        writer: false,
        attendee: true,
    },
    {
        name: '가을 특별행사',
        date: '2025-10-25 00:00:00',
        startHour: '14:00:00',
        writer: false,
        attendee: false,
    },
    {
        name: '11월 정기모임',
        date: '2025-11-10 00:00:00',
        writer: false,
        attendee: false,
    },
    {
        name: '12월 정기모임',
        date: '2025-12-15 00:00:00',
        writer: false,
        attendee: false,
    },
];

const personalRecallData = {
    collaborationProfile:
        "내가 가장 잘했다고 생각하는 건 ‘전체 흐름을 잡아가는 능력’이었다. 연간 운영 기획안 작성부터 시작해서, 정기모임과 특별행사 회차를 적절히 배치하고, 회차별 테마와 진행 흐름을 미리 구성해두는 것까지. 이 일련의 과정에서 ‘앞을 내다보는 감각’을 키울 수 있었다. 특히 8월, 활동 시작 전 회의에서 국원들과 함께 머리를 맞대고 올해의 활동을 설계했던 그 순간이 기억에 남는다. 당시에는 일정표를 만드는 데 그치지 않고, 각 시점에 우리 팀의 에너지가 어느 정도일지, 학교 일정이 어떤 영향을 줄지까지 고려했다. 중간고사 기간이나 방학 직전 시점엔 무리한 기획을 줄이고, 5월이나 10월처럼 분위기가 들뜰 시점엔 실험적인 콘텐츠를 배치하는 방식으로 구성했다. 덕분에 한 학기 전체 흐름이 지나치게 단조롭거나, 반대로 과하게 분산되지 않고 잘 이어졌다.\n\n특히 좋았던 건 ‘회차 간 연결성’에 대한 고민이었다. 예를 들어 12월에 진행한 ‘세계 간식 교류회’는 단발성 이벤트가 아니라, 그 다음 정기모임에서 음식 관련 표현을 다루는 활동과 자연스럽게 이어지도록 했다. 또 겨울 모임에서는 ‘시적 언어’를 테마로 잡아, 참여자들이 감성적인 분위기를 즐기도록 구성했는데, 이 역시 퀴즈파티에서 보여준 문화 차이에 대한 관심이 다음 활동으로 확장되도록 연결한 결과였다.\n\n그리고 팀원인 국원과 역할을 나눌 때도 전체 흐름을 고려해 안배하려 노력했다. 국원이 한 회차를 담당하면, 다음 회차는 내가 주도해서 아이디어를 내고, 그다음은 다시 국원이 메인 운영자가 되도록 배치했다. 서로의 리듬을 살펴가며 일정에 균형을 맞춘 덕분에 활동이 끝까지 무너지지 않고 잘 유지될 수 있었다. 무엇보다도, 회차마다 방향성과 콘셉트를 명확히 전달하면서도, 디테일은 팀원과 함께 채워나간 점이 좋았던 것 같다. 기획자로서 방향을 제시하고, 실행 단계에서는 융통성 있게 조율하는 균형을 유지한 한 해였다.\n\n결과적으로, 단순히 활동이 잘 운영됐다는 걸 넘어서서, 팀의 기획력이 시간이 지날수록 다듬어지고 세련돼지는 과정을 경험했다. 덕분에 평균 행사 참여율 전년 대비 104.2% 달성, 동아리 회원 유지율 27.1% 달성, \'매우 만족\' 피드백 비율 63.7% 확보라는 만족스러운 성과를 이룰 수 있었던 것 같다.\n",
    memorableExperience:
        "돌이켜보면, 예상 가능한 변수에 대한 사전 대응력이 부족했던 순간들이 있었다. 매 회차를 준비하면서 진행 흐름과 콘텐츠 구성을 다듬는 데 집중하다 보니, 오히려 \'사람\'이 만든 변수나 예상치 못한 상황을 놓친 경우가 있었다. 가장 기억에 남는 건 10월 정기모임이었다. 당시 활동 구성은 탄탄했지만, 시험 기간 직후라 예상보다 참석률이 낮았다. 참석 인원이 적어지면서 준비한 조별 활동이 부자연스럽게 흘렀고, 현장에서 급히 프로그램 일부를 수정해야 했다.\n\n그때 문득 든 생각은, 아무리 기획이 잘되어 있어도 실제 상황은 언제든 바뀔 수 있다는 점이었다. 플랜 B를 준비해야 한다는 걸 알고 있었는데, 솔직히 시간도 부족하고 귀찮아서 실천하지 못했다. 이 경험 이후로는 플랜 B의 중요성에 대해 다시 한 번 깨닫고, 인원 수에 따라 구성할 수 있는 유연한 활동 구조도 생각하게 됐다. 또한, 참여자들의 전반적인 컨디션이나 반응을 읽는 감각도 더 중요하게 여기게 됐다.\n\n활동 후반부에는 회차별로 예상 리스크를 회의 때 먼저 짚고 넘어갔고, 국원과 역할을 나눌 때에도 \'예상 변수 체크 담당\'이라는 식의 실무 역할을 도입했다. 예를 들어 10월 정기모임 전에는 우천 시 대체 프로그램, 인원 급증 시 추가 세션 운영 등 다양한 경우의 수를 미리 시뮬레이션해보았다.\n\n이러한 경험을 통해 나는 ‘계획을 세우는 사람’에서 ‘상황을 조율할 수 있는 사람’으로 조금씩 바뀌어가고 있다는 걸 느꼈다. 이전에는 알고 있어도 귀찮아서 잘 실행하지 못했는데, 이제는 정말 실행까지 할 수 있게 된 것 같다.",
    strengthsAndGrowth:
        "이번 활동은 단순한 ‘기획 경험’ 이상의 것이었다. 나에게 이 시간은 ‘관계의 리듬을 설계하는 감각’을 체득한 시간이었고, 동시에 \'가볍고 즐겁게 일한다\'는 것에 대한 신념을 다시 확인한 시간이었다. 특히나 언어교환 동아리는 단순한 프로젝트보다는 ‘사람과 사람을 이어주는 장’을 기획하는 일이었기 때문에, 콘텐츠의 완성도만큼이나 그 안에 흐르는 분위기와 감정선을 어떻게 다룰 것인가가 중요했다.\n\n예를 들어, 우리가 매 회차 아이스브레이킹을 빼놓지 않고 넣은 것도 단순한 포맷이 아니라 철학이었다. 어떤 모임이든 처음 마주한 사람이 자연스럽게 말문을 틀 수 있어야 그다음 활동이 의미를 가질 수 있다. 그래서 때로는 웃긴 질문, 때로는 감성적인 한 문장, 때로는 언어유희나 가벼운 게임을 통해 분위기를 여는 연습을 계속했다. 이런 시도 속에서 나는 \'모임의 긴장도를 설계하는 것\'이 기획의 핵심이라는 걸 실감하게 됐다.\n\n또한 나는 이 활동을 하면서 ‘모든 일은 결국 사람이 한다’는 당연한 사실을 또다시 아주 실감나게 체득했다. 콘텐츠만 치밀하면 되는 게 아니라, 그걸 함께 준비하는 국원이 어떤 리듬으로 일하는 사람인지, 어떤 표현 방식에 편한지를 파악하고 맞춰가는 일이 정말 중요했다. 우리가 번갈아 회차를 맡을 때마다, 내가 먼저 틀을 잡고 국원이 편하게 들어올 수 있도록 설계한 것도 그 때문이었다. 내 기준에 맞추기보다는 서로의 장점을 살릴 수 있는 구도를 만들고자 했다.\n\n무엇보다도 이 활동은 나에게 ‘일을 잘한다는 것’이 결국 ‘편하게 다가갈 수 있는 팀 분위기’를 만드는 데서 출발한다는 걸 알려줬다. 회의도, 활동도, 모임도 결국 사람이 중심이고, 그 흐름을 내가 앞장서 조율한다는 책임감과 동시에 즐거움도 있었다. ‘정리력’이나 ‘콘텐츠 기획력’도 중요한 역량이지만, 나는 그것보다도 이 동아리 안에서 ‘흐름을 살피는 능력’과 ‘사람 중심의 운영 감각’을 키운 것이 더 소중하다고 느낀다. 이건 단순히 기획자가 아니라, 앞으로 어떤 일을 하든 반드시 필요한 태도라고 생각한다.\n\n나는 결국, 내가 만든 흐름 안에서 사람들이 자연스럽게 움직이는 걸 볼 때 가장 큰 기쁨을 느낀다. 그게 회의든, 정기모임이든, 특별 이벤트든 아니면 아예 이 활동이 아니라 다른 활동이든 다 똑같은 것 같다.",
};

@Injectable()
export class DummyDataService {
    constructor(
        private readonly configService: ConfigService,
        private readonly userProjectRepository: UserProjectRepository
    ) {}

    async createDummyDataForNewProject(qr: QueryRunner, userId: number, projectId: number) {
        const memberId = this.configService.get<number>('DEFAULT_MEMBER_OF_PROJECT') || 3;

        // 프로젝트 생성 시 팀원 추가
        const isValid = this.userProjectRepository.findById(memberId, projectId);
        if (!isValid) {
            const up = qr.manager.create(UserProject, {
                user: { id: memberId },
                project: { id: projectId },
                permission: projectPermission.MEMBER,
                role: '',
            });
            await this.userProjectRepository.saveUserProject(up, qr.manager);
        }
        // 개인회고 생성
        const recall = qr.manager.create(PersonalRecall, {
            user: { id: userId },
            project: { id: projectId },
            collaborationProfile: personalRecallData.collaborationProfile,
            memorableExperience: personalRecallData.memorableExperience,
            strengthsAndGrowth: personalRecallData.strengthsAndGrowth,
        });
        await qr.manager.save(PersonalRecall, recall);

        // 스텝 및 업무, 업무 담당자 설정
        for (const step of dashboardData.steps) {
            const newStep = qr.manager.create(Step, {
                name: step.name,
                project: { id: projectId },
            });
            await qr.manager.save(Step, newStep);
            for (const task of step.tasks) {
                const newTask = qr.manager.create(Task, {
                    name: task.name,
                    deadline: task.deadline,
                    status: task.status,
                    memo: task.memo,
                    step: newStep,
                });
                await qr.manager.save(Task, newTask);
                if (task.manager) {
                    const newManager = qr.manager.create(Manager, {
                        user: { id: userId },
                        task: newTask,
                    });
                    await qr.manager.save(Manager, newManager);
                }
            }
        }

        // 일정 및 일정 참석자, 기록자 설정
        for (const plan of planData) {
            const newPlan = qr.manager.create(Plan, {
                name: plan.name,
                date: plan.date,
                location: plan.location,
                memo: plan.memo,
                startHour: plan.startHour,
                meetingRecords: plan.meetingRecords,
                project: { id: projectId },
            });
            await qr.manager.save(Plan, newPlan);
            if (plan.attendee) {
                const newAttendee = qr.manager.create(Attendee, {
                    user: { id: userId },
                    plan: newPlan,
                });
                await qr.manager.save(Attendee, newAttendee);
            }
            if (plan.writer) {
                const newWriter = qr.manager.create(Writer, {
                    user: { id: userId },
                    plan: newPlan,
                });
                await qr.manager.save(Writer, newWriter);
            }
        }
    }
}
