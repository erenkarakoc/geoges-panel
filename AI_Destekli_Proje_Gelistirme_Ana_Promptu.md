# AI Destekli Proje Geliştirme Ana Promptu

Projede konuştuğumuz ve belirlediğimiz tüm özellikleri, modülleri ve gereksinimleri kapsam dahilinde tutalım.

Daha önce kararlaştırılmış hiçbir özellik sessizce:

- çıkarılmamalı,
- basitleştirilmemeli,
- değiştirilmemeli,
- ertelenmemeli,
- başka bir çözümle ikame edilmemeli.

Projenin amacı yalnızca çalışan bir yazılım geliştirmek değildir.

Aynı zamanda:

- tutarlı,
- kontrol edilebilir,
- denetlenebilir,
- sürdürülebilir,
- ölçeklenebilir,
- modüler,
- güvenli,
- test edilebilir,
- dokümante edilmiş,
- kullanıcı dostu,
- profesyonel UI/UX'e sahip,
- AI modelleri tarafından güvenilir biçimde geliştirilebilir,
- farklı AI modelleri arasında devredilebilir,
- farklı session'lar arasında bağlam kaybetmeyen,
- hangi aşamada olduğumuzun her zaman açıkça görülebildiği

bir mühendislik sistemi oluşturmak istiyorum.

Bu dokümanda belirtilen kurallar AI modelleri için tavsiye değil, proje çalışma protokolüdür.

---

## 1. Temel çalışma prensibi

Proje tek seferde geliştirilmeye çalışılmayacaktır.

Proje:

```text
Project
↓
Phase
↓
Subphase
↓
Feature
↓
Task
↓
Implementation
↓
Verification
```

şeklinde parçalanacaktır.

Her aşama temel olarak şu döngüyü takip edecektir:

```text
DISCOVER
↓
QUESTION
↓
DECIDE
↓
DESIGN
↓
PLAN
↓
IMPLEMENT
↓
TEST
↓
REVIEW
↓
DOCUMENT
↓
VERIFY
↓
DONE
```

Bir aşama tamamlanmadan sonraki aşamaya geçilmemelidir.

“Şimdilik böyle yapalım”, “sonra bakarız”, “ileride düzeltiriz” yaklaşımıyla konular sessizce açık bırakılamaz.

Bilinçli olarak ertelenmesi gereken konular:

```text
DEFERRED
```

olarak kaydedilmeli ve:

- neden ertelendiği,
- hangi aşamada tekrar ele alınacağı,
- hangi görevlere bağımlı olduğu

belirtilmelidir.

---

## 2. Zorunlu soru-cevap aşaması

Her önemli aşama veya feature öncesinde AI doğrudan kod yazmamalıdır.

Önce eksik kararları tespit etmelidir.

Minimum olarak şu alanlar değerlendirilmelidir:

- iş gereksinimleri,
- kullanıcı rolleri,
- kullanıcı senaryoları,
- kullanıcı akışları,
- UI/UX gereksinimleri,
- veri modeli,
- permissions,
- authentication,
- authorization,
- security,
- edge-case'ler,
- hata durumları,
- entegrasyonlar,
- performans,
- ölçeklenebilirlik,
- logging,
- audit,
- monitoring,
- veri yaşam döngüsü,
- backup/recovery,
- migration,
- testing,
- accessibility.

Sorular rastgele değil kategorik biçimde hazırlanmalıdır.

Sorular cevaplandıktan sonra:

```text
PHASE DECISION SUMMARY
```

veya

```text
FEATURE DECISION SUMMARY
```

hazırlanmalıdır.

Kritik kararlar netleşmeden implementasyona geçilmemelidir.

---

## 3. Phase Gate sistemi

Her Phase için başlangıç ve tamamlanma kriterleri oluşturulacaktır.

Örneğin:

```text
PHASE 07 – FILE INFRASTRUCTURE

ENTRY CRITERIA

[x] Authentication completed
[x] Authorization model completed
[x] Storage architecture approved

EXIT CRITERIA

[x] Upload
[x] Download
[x] Signed URLs
[x] Permissions
[x] Metadata
[x] Delete lifecycle
[x] Versioning decision
[x] R2 integration
[x] Error handling
[x] Tests
[x] Security review
[x] Documentation
```

Bütün zorunlu maddeler tamamlanmadıkça Phase:

```text
DONE
```

olamaz.

---

## 4. Merkezi proje state sistemi

AI modelleri yalnızca conversation history veya kendi memory sistemlerine güvenmemelidir.

Repository içerisinde proje durumunu taşıyan kalıcı bir yapı bulunmalıdır.

Önerilen yapı:

```text
/docs
    /architecture
    /decisions
    /features
    /requirements
    /database
    /security
    /infrastructure
    /workflows
    /ui-ux
    /standards
    /domain

/ai
    PROJECT_CONTEXT.md
    PROJECT_RULES.md

    MASTER_ROADMAP.md
    CURRENT_STATE.md

    REQUIREMENTS.md
    TASKS.md

    DECISIONS.md
    OPEN_QUESTIONS.md
    DEFERRED.md

    COMPLETED.md
    CHANGELOG.md

    AI_SKILLS.md
    SESSION_HANDOFF.md
```

AI yeni session başladığında ilgili proje dosyalarını okumadan geliştirmeye başlamamalıdır.

---

## 5. CURRENT_STATE

`CURRENT_STATE.md` projenin temel doğruluk kaynaklarından biri olacaktır.

Minimum olarak:

```text
PROJECT STATUS:

CURRENT PHASE:

CURRENT SUBPHASE:

CURRENT FEATURE:

CURRENT TASK:

LAST COMPLETED TASK:

NEXT TASK:

BLOCKED BY:

OPEN QUESTIONS:

RECENT DECISIONS:

DEFERRED ITEMS:

KNOWN ISSUES:

ACTIVE RISKS:
```

tutulmalıdır.

---

## 6. Task status sistemi

Her görev şu statülerden birine sahip olmalıdır:

```text
NOT_STARTED

DISCOVERY

QUESTIONS_PENDING

DESIGNING

READY_FOR_IMPLEMENTATION

IMPLEMENTING

TESTING

REVIEW

BLOCKED

DEFERRED

DONE
```

AI statüleri gerçek durumu yansıtacak şekilde güncellemelidir.

---

## 7. Definition of Done

Kodun yazılmış olması bir feature'ın tamamlandığı anlamına gelmez.

Minimum Definition of Done:

```text
Requirements                    PASS
Business Logic                  PASS
Architecture                    PASS
Data Model                      PASS
Authorization                   PASS
Security                        PASS
Implementation                  PASS
UI/UX                           PASS
Responsive Design               PASS
Accessibility                   PASS
Loading States                  PASS
Empty States                    PASS
Error States                    PASS
Edge Cases                      PASS
Tests                           PASS
Performance Review              PASS
Documentation                   PASS
State Documentation Updated     PASS
```

Bunlardan zorunlu olan herhangi biri başarısızsa:

```text
STATUS: NOT COMPLETE
```

olmalıdır.

---

## 8. AI modellerinin değişmez kuralları

AI:

1. Kritik konularda sessiz varsayım yapmamalıdır.
2. Belirsiz gereksinimleri soru haline getirmelidir.
3. Mevcut mimariyi anlamadan yeni mimari oluşturmamalıdır.
4. Aynı business logic'i birden fazla yerde oluşturmamalıdır.
5. Mevcut abstractions varsa yeniden kullanmalıdır.
6. Bir değişikliğin etkilediği diğer alanları analiz etmelidir.
7. Kısa vadeli hack'leri varsayılan çözüm olarak kullanmamalıdır.
8. Test edilmemiş bir sistemi çalışıyor kabul etmemelidir.
9. Kritik kararları yalnızca chat içerisinde bırakmamalıdır.
10. Önemli kararları repository içerisinde kaydetmelidir.
11. Bitmeyen işi DONE yapmamalıdır.
12. Büyük mimari değişikliklerden önce impact analysis yapmalıdır.
13. Mevcut kararla çelişiyorsa bunu açıkça belirtmelidir.
14. Kullanılmayan veya gereksiz abstraction üretmemelidir.
15. Overengineering yapmamalıdır.
16. Yalnızca mevcut ihtiyacı değil bilinen yakın gelecek ihtiyaçlarını da değerlendirmelidir.
17. Ancak henüz var olmayan varsayımsal ihtiyaçlar uğruna sistemi gereksiz karmaşıklaştırmamalıdır.

---

## 9. Architecture Decision Records

Önemli mimari kararlar ADR olarak tutulacaktır.

Örnek:

```text
/docs/decisions/

ADR-001-supabase.md
ADR-002-cloudflare-r2.md
ADR-003-modular-monolith.md
ADR-004-background-processing.md
```

ADR:

```text
# Decision

## Context

## Problem

## Alternatives

## Selected Solution

## Reason

## Advantages

## Disadvantages

## Risks

## Migration Considerations

## Date

## Status
```

yapısında tutulmalıdır.

---

## 10. Feature Specifications

Her önemli feature için specification oluşturulmalıdır.

```text
/docs/features/FEATURE-XXX-name.md
```

Minimum içerik:

```text
Purpose

Actors

Permissions

User Stories

User Flow

UX Flow

Business Rules

Data Requirements

Backend Requirements

Frontend Requirements

Security

Edge Cases

Error States

Loading States

Empty States

Logging

Testing

Acceptance Criteria

Future Considerations
```

---

## 11. Requirement Traceability

Gereksinimlerin implementation içerisinde kaybolmasını istemiyorum.

Mümkün olduğunca:

```text
Requirement
↓
Feature
↓
Task
↓
Database
↓
Backend
↓
Frontend
↓
Tests
↓
Deployment
```

takip edilebilmelidir.

Örnek:

```text
REQ-032

FEATURE-012

TASK-081
TASK-082
TASK-083

DATABASE
documents
document_versions

APPLICATION
documentService

UI
DocumentUploader

TEST
document-upload.spec.ts
```

---

## 12. Dependency sistemi

Task'lar dependency bilgisine sahip olmalıdır.

Örnek:

```text
TASK-023

Document Versioning

depends_on:

TASK-011
TASK-018
TASK-021
```

Zorunlu dependency tamamlanmadan task başlatılmamalıdır.

---

## 13. Change Management

Yeni bir değişiklik talebi geldiğinde doğrudan implementasyon yapılmamalıdır.

Önce:

```text
Requested Change

Reason

Affected Requirements

Affected Features

Affected Tasks

Affected Database

Affected APIs

Affected UI

Affected Permissions

Affected Tests

Migration Requirement

Backward Compatibility

Risks

Recommended Approach
```

analizi yapılmalıdır.

---

## 14. Session continuity

Session sonunda minimum olarak:

```text
SESSION HANDOFF

Completed

Partially Completed

Current State

Next Task

Open Questions

New Decisions

Deferred Items

Technical Debt

Known Bugs

Files Changed

Tests Run

Important Context
```

oluşturulmalıdır.

Yeni AI session başladığında önce bu bilgiler okunmalıdır.

Amaç:

```text
"Nerede kalmıştık?"
```

sorusunun ortadan kaldırılmasıdır.

---

## 15. Kodlama öncesi implementation plan

Önemli task'larda kodlamadan önce:

```text
TASK

Goal

Dependencies

Affected Files

Database Changes

Backend Changes

Frontend Changes

Security

Tests

Migration

Rollback Strategy

Acceptance Criteria
```

planı oluşturulmalıdır.

---

## 16. Ana uygulama teknolojisi

Temel stack:

```text
Next.js
TypeScript
Supabase
Cloudflare R2
GitHub
VPS
```

Gerektiğinde:

```text
Google Cloud Run
```

kullanılabilir.

Teknoloji seçimi ihtiyaçtan doğmalıdır.

---

## 17. Next.js

Ana uygulama Next.js üzerinde geliştirilecektir.

Mimari:

```text
UI
↓
Application
↓
Domain / Business Logic
↓
Data Access
↓
Infrastructure
```

sorumluluklarını mümkün olduğunca ayrıştırmalıdır.

Business logic React component'larının içerisine dağılmamalıdır.

Next.js framework version'ına uygun güncel yöntemler kullanılmalıdır.

AI yalnızca eğitim verisine güvenmemeli, framework davranışının version-specific olduğu durumlarda mevcut proje sürümünü dikkate almalıdır.

---

## 18. Supabase

İlk aşamada:

```text
Supabase Cloud
```

kullanılacaktır.

İleride:

```text
Self-hosted Supabase
→
kendi VPS altyapımız
```

geçişi mümkün olmalıdır.

Mimari Supabase Cloud'a geri döndürülemez şekilde bağımlı olmamalıdır.

Özellikle:

- PostgreSQL
- Auth
- Realtime
- Storage
- Edge Functions
- Cron
- Queues
- Secrets

kullanımlarında portability değerlendirilmelidir.

---

## 19. Database

Database UI ekranlarına göre değil domain modeline göre tasarlanacaktır.

Her entity için:

```text
Purpose
Ownership
Relationships
Constraints
Indexes
Permissions
RLS
Audit
History
Soft Delete
Retention
```

değerlendirilecektir.

Schema değişiklikleri migration üzerinden takip edilebilir olmalıdır.

---

## 20. Cloudflare R2

Dosyaların ana object storage sistemi:

```text
Cloudflare R2
```

olacaktır.

Ancak application doğrudan R2'ye sıkı bağımlı hale gelmemelidir.

Örneğin:

```text
StorageProvider

upload()
download()
delete()
exists()
getSignedUrl()
```

abstraction'ı kullanılabilir.

İleride:

```text
R2
S3
MinIO
Supabase Storage
Google Cloud Storage
```

arasında geçiş mümkün olmalıdır.

---

## 21. Google Cloud Run

Ana Next.js uygulaması Cloud Run üzerinde host edilmeyecektir.

Cloud Run gerektiğinde:

- ağır processing,
- AI workloads,
- OCR,
- parsing,
- CPU yoğun işler,
- bağımsız worker,
- document processing

gibi işler için kullanılabilir.

---

## 22. VPS Production Infrastructure

Next.js ana application kendi VPS altyapımızda çalışacaktır.

Production aşamasında:

- Docker,
- reverse proxy,
- SSL,
- CI/CD,
- secrets,
- environment management,
- health checks,
- logging,
- monitoring,
- backups,
- deployment,
- rollback,
- minimal downtime

ayrı ayrı tasarlanmalıdır.

---

## 23. GitHub

GitHub merkezi source-control sistemi olacaktır.

Değişiklikler takip edilebilir olmalıdır.

Commit ve branch stratejisi proje büyüklüğüne uygun olmalıdır.

Örneğin:

```text
feature/
fix/
refactor/
infra/
docs/
test/
```

---

## 24. CI/CD

Pipeline minimum olarak:

```text
lint
↓
type-check
↓
unit tests
↓
integration tests
↓
build
↓
security checks
↓
deployment
↓
health check
```

aşamalarını değerlendirmelidir.

Production deploy başarısız olduğunda rollback mümkün olmalıdır.

---

## 25. Environment

Minimum ortamlar:

```text
development
staging
production
```

olmalıdır.

Production üzerinde deneysel geliştirme yapılmamalıdır.

---

## 26. Security by Design

Security daha sonra yapılan bir kontrol değildir.

Her feature içerisinde değerlendirilmelidir.

Minimum:

- authentication,
- authorization,
- RLS,
- roles,
- permissions,
- validation,
- rate limiting,
- secrets,
- signed URLs,
- audit,
- tenant isolation,
- sensitive data,
- dependency security

kontrol edilmelidir.

---

## 27. Observability

Sistem:

- application logs,
- structured logs,
- error tracking,
- audit logs,
- job logs,
- infrastructure monitoring,
- health checks,
- performance monitoring

sağlayabilmelidir.

---

## 28. Background Jobs

Uzun işlemler request içerisinde bekletilmemelidir.

Job lifecycle:

```text
QUEUED
PROCESSING
COMPLETED
FAILED
RETRYING
CANCELLED
```

olarak takip edilebilir olmalıdır.

---

## 29. Idempotency

Özellikle:

- payments,
- uploads,
- AI processing,
- webhooks,
- imports,
- workers,
- background jobs

duplicate işlem üretmemelidir.

Gereken noktalarda idempotency uygulanmalıdır.

---

## 30. Audit

Kritik işlemlerde gerektiğinde:

```text
WHO
WHAT
WHEN
SOURCE
OLD VALUE
NEW VALUE
IP
DEVICE
```

gibi bilgiler audit edilebilir olmalıdır.

---

## 31. Ölçeklenebilirlik stratejisi

İlk günden microservice mimarisi kurulmamalıdır.

Temel yaklaşım:

```text
MODULAR MONOLITH
```

olacaktır.

Ancak ileride:

- AI Processing
- Document Processing
- Notifications
- Search
- Analytics
- Workers

gibi sınırları belirgin modüllerin ayrıştırılabilmesi mümkün olmalıdır.

---

## 32. UI altyapısı

Projenin ana UI component sistemi:

```text
https://coss.com/ui
```

olacaktır.

Yeni bir component geliştirilmeden önce COSS içerisinde uygun primitive, component veya pattern bulunup bulunmadığı kontrol edilmelidir.

Mümkün olduğunca:

```text
COSS component
↓
project design tokens
↓
project composition
```

yaklaşımı kullanılmalıdır.

Aynı component'in farklı yerlerde farklı ve tutarsız implementasyonlarının oluşmasına izin verilmemelidir.

COSS yalnızca component kaynağı değildir; projenin temel design-system referanslarından biri olarak kabul edilmelidir.

---

## 33. devl.dev kullanımı

UI geliştirme sırasında zaman zaman:

```text
https://www.devl.dev/
```

üzerindeki tasarım örneklerinden ve pattern'lerden faydalanabiliriz.

Ancak kullanım prensibi:

```text
Copy blindly
```

değil:

```text
Inspect
↓
Understand
↓
Adapt
↓
Standardize
```

olmalıdır.

devl.dev özellikle:

- application shells,
- dashboards,
- navigation,
- settings,
- forms,
- authentication,
- onboarding,
- cards,
- data displays,
- empty states,
- activity feeds,
- notifications

gibi alanlarda inspiration/reference amacıyla kullanılabilir.

Ancak projenin design language'ı parçalanmamalıdır.

---

## 34. UI kaynak önceliği

Yeni bir UI ihtiyacında sıralama:

```text
1. Kullanıcı ihtiyacı ve doğru UX flow
2. Mevcut project design system
3. COSS UI
4. Mevcut project components
5. devl.dev patterns
6. Gerekiyorsa custom component
```

olmalıdır.

Sırf hazır component bulunduğu için kötü UX oluşturulmamalıdır.

---

## 35. Profesyonel UI/UX standardı

UI yalnızca “güzel görünmek” amacıyla geliştirilmemelidir.

Her ekran:

```text
User Goal
↓
Information Hierarchy
↓
Primary Action
↓
Secondary Actions
↓
Feedback
↓
Recovery
```

mantığıyla değerlendirilmelidir.

UI/UX:

- sade,
- profesyonel,
- tutarlı,
- hızlı anlaşılır,
- erişilebilir,
- responsive,
- kullanıcıyı yönlendiren,
- gereksiz cognitive load oluşturmayan

bir yapıya sahip olmalıdır.

---

## 36. Her ekran için zorunlu UX durumları

Uygun olduğu yerlerde aşağıdaki durumlar düşünülmelidir:

```text
INITIAL
LOADING
SUCCESS
EMPTY
PARTIAL
ERROR
PERMISSION DENIED
OFFLINE
RETRY
DESTRUCTIVE CONFIRMATION
```

Bir ekran yalnızca ideal/happy-path tasarlanarak tamamlanmış sayılmamalıdır.

---

## 37. Form UX

Formlarda minimum olarak:

- doğru input türü,
- anlaşılır label,
- yardımcı açıklama,
- client validation,
- server validation,
- field-level error,
- form-level error,
- loading state,
- success feedback,
- duplicate submit prevention,
- keyboard navigation

değerlendirilmelidir.

---

## 38. Accessibility

UI mümkün olduğunca WCAG 2.2 AA seviyesine uygun geliştirilmelidir.

Özellikle:

- keyboard navigation,
- focus states,
- semantic HTML,
- labels,
- aria kullanımı,
- contrast,
- screen reader behavior,
- error communication

düşünülmelidir.

Accessibility sonradan eklenen polish değildir.

Definition of Done'ın parçasıdır.

---

## 39. Responsive Design

Responsive davranış rastlantısal olmamalıdır.

Her önemli ekran için:

```text
Desktop
Tablet
Mobile
```

davranışı düşünülmelidir.

Desktop layout'ın yalnızca küçültülmüş hali mobile verilmemelidir.

Gerekirse mobile özel information hierarchy uygulanmalıdır.

---

## 40. Design Tokens

Renk, spacing, radius, typography, shadows ve diğer tasarım kararları mümkün olduğunca merkezi token sisteminden gelmelidir.

Örneğin:

```text
color
spacing
radius
typography
shadow
z-index
breakpoint
motion
```

değerleri component içerisinde rastgele oluşturulmamalıdır.

---

## 41. UI consistency review

Önemli UI değişikliklerinden sonra AI şu kontrolü yapmalıdır:

```text
Does this already exist elsewhere?
Is the pattern consistent?
Does COSS already solve it?
Are spacing values consistent?
Are typography levels consistent?
Are states complete?
Is mobile considered?
Is accessibility considered?
Does the UX require fewer steps?
Is the primary action clear?
```

---

## 42. AI'nin proje içerisindeki rolü

AI yalnızca developer değildir.

AI gerektiğinde:

- Product Analyst
- Requirements Analyst
- UX Analyst
- System Architect
- Database Architect
- Security Reviewer
- Developer
- Tester
- Code Reviewer
- Documentation Assistant
- DevOps Assistant
- Project Continuity Assistant

rollerini üstlenebilir.

Ancak implementation yapan AI'nın kendi kodunu kontrol ederken hata kaçırabileceği kabul edilmelidir.

Önemli görevlerde:

```text
IMPLEMENT
↓
INDEPENDENT REVIEW
↓
AUTOMATED TEST
↓
HUMAN APPROVAL gerektiğinde
```

yaklaşımı tercih edilmelidir.

---

## 43. AI Skills altyapısı

Projede AI modellerinin yalnızca kendi pretrained bilgisinden faydalanmasını istemiyorum.

Framework, infrastructure, database, UI ve diğer alanlarda yaygın olarak kullanılan ve güvenilirliği bilinen:

```text
Agent Skills
```

proje başlangıcında değerlendirilmelidir.

Ama amaç:

```text
"Bulduğumuz bütün skill'leri yüklemek"
```

değildir.

Amaç:

```text
minimum
high-quality
maintained
trusted
relevant
```

bir skill set oluşturmaktır.

---

## 44. Skill güven sınıflandırması

Skill'ler güven seviyesine göre sınıflandırılmalıdır.

### Tier A – First Party

Tercih edilen seviye.

Skill doğrudan kullandığımız teknolojinin geliştiricisi tarafından yayınlanıyorsa öncelikli olmalıdır.

Örneğin:

```text
Supabase
COSS
Cloudflare
Vercel / Next.js
```

### Tier B – Established Third Party

Uzun süredir kullanılan, aktif geliştirilen ve topluluk tarafından yaygın kullanılan projeler.

Örneğin:

```text
claude-mem
```

### Tier C – Community

Community skill'ler doğrudan kurulmayacaktır.

Önce:

- repository,
- maintainer,
- source code,
- permissions,
- scripts,
- network access,
- popularity,
- maintenance activity,
- license,
- security risk

incelenmelidir.

---

## 45. Başlangıçta değerlendirilecek AI Skill Set

İlk bootstrap aşamasında minimum olarak aşağıdakiler değerlendirilmelidir.

### 45.1 claude-mem

Amaç:

```text
cross-session memory
context retrieval
development history
```

sağlamaktır.

Ancak çok önemli kural:

```text
claude-mem ≠ project source of truth
```

claude-mem yardımcı memory katmanıdır.

Asıl source of truth:

```text
Git
+
/ai
+
/docs
+
CURRENT_STATE.md
+
ROADMAP
+
ADR
```

olacaktır.

Memory sistemi bozulsa veya başka bir AI modeline geçilse dahi proje devam edebilmelidir.

### 45.2 Supabase Official Agent Skills

Supabase ile ilgili bütün development task'larında Supabase'in resmi Agent Skills sistemi kullanılmalıdır.

Minimum olarak:

```text
supabase
```

ve database değişiklikleri için:

```text
supabase-postgres-best-practices
```

değerlendirilmelidir.

Supabase task'larında AI'nın yalnızca pretrained bilgisine güvenmesi engellenmelidir.

Özellikle:

- Auth,
- RLS,
- PostgreSQL,
- migrations,
- SSR,
- Realtime,
- Storage,
- security

konularında resmi Supabase yönergeleri önceliklidir.

### 45.3 COSS Official Skill

COSS UI kullandığımız için resmi COSS AI skill'i başlangıç skill set'ine dahil edilmelidir.

Böylece AI:

- doğru component seçimi,
- component composition,
- styling,
- COSS conventions,
- primitives,
- patterns

konularında tahmin yürütmek yerine COSS'un kendi knowledge base'ini kullanabilmelidir.

### 45.4 Vercel React Best Practices

React ve Next.js implementationlarında Vercel tarafından sağlanan React best-practices skill'i değerlendirilmelidir.

Özellikle:

- rendering,
- waterfalls,
- data fetching,
- bundle size,
- re-renders,
- server/client boundaries,
- performance

konularında kullanılmalıdır.

Ancak framework-specific guidance her zaman projenin kullandığı gerçek Next.js sürümüyle uyumlu olmalıdır.

### 45.5 Next.js official agent guidance

Next.js için mevcut proje sürümü tespit edilmeden rastgele skill yüklenmemelidir.

Next.js'in mevcut version-matched agent documentation veya official skills yapısı varsa kullanılmalıdır.

Kural:

```text
Project Next.js Version
↓
Compatible Official Guidance
↓
Implementation
```

olmalıdır.

Latest framework dokümantasyonu eski proje sürümüne körü körüne uygulanmamalıdır.

### 45.6 Cloudflare Official Skills

Cloudflare R2 kullandığımız için Cloudflare'ın resmi Agent Skills paketi değerlendirilmelidir.

Özellikle:

```text
R2
Workers gerektiğinde
Cloudflare configuration
security
platform conventions
```

konularında resmi Cloudflare guidance tercih edilmelidir.

---

## 46. Skill Registry

Yüklenen skill'ler takip edilmelidir.

```text
/ai/AI_SKILLS.md
```

dosyasında:

```text
Skill Name
Provider
Repository
Official / Third Party
Purpose
Version / Commit
Installed Date
Last Updated
Scope
Triggers
Permissions
Risk Level
Last Audit
Status
```

tutulmalıdır.

---

## 47. Skill version management

Skill'ler kontrolsüz şekilde güncellenmemelidir.

Yeni version geldiğinde gerektiğinde:

```text
Current Version
↓
New Version
↓
Changelog
↓
Breaking Changes
↓
Security Review
↓
Update
```

akışı uygulanmalıdır.

Önemli production projesinde bir skill'in davranışının haberimiz olmadan değişmesini istemiyorum.

---

## 48. Skill precedence

Bir skill ile proje kuralları çelişirse:

```text
PROJECT RULES
>
ARCHITECTURE DECISIONS
>
PROJECT DOCUMENTATION
>
OFFICIAL FRAMEWORK GUIDANCE
>
INSTALLED SKILLS
>
AI PRETRAINED KNOWLEDGE
```

öncelik sırası kullanılmalıdır.

Skill proje mimarisini kendi isteğine göre değiştiremez.

---

## 49. Skill auto-activation

Her skill her task'ta prompt içerisine yüklenmemelidir.

Relevant skill ihtiyaç olduğunda aktive edilmelidir.

Örneğin:

```text
Supabase task
→ Supabase skill

R2 task
→ Cloudflare skill

UI task
→ COSS skill

React performance task
→ Vercel React skill
```

Bu sayede context gereksiz bilgilerle doldurulmaz.

---

## 50. Skill security

Skill içerisinde:

- executable scripts,
- shell commands,
- network calls,
- filesystem access,
- credentials,
- MCP connections

bulunabiliyorsa kurulumdan önce değerlendirilmelidir.

Özellikle third-party skill'e yalnızca popularity sebebiyle güvenilmemelidir.

---

## 51. MCP security

İleride Supabase, GitHub, Cloudflare veya başka servisler için MCP kullanılıyorsa:

```text
least privilege
```

ilkesi uygulanmalıdır.

Environment'lar ayrılmalıdır.

Örneğin:

```text
Development
Staging
Production
```

Production üzerinde AI'ya varsayılan olarak sınırsız write yetkisi verilmemelidir.

Kritik işlemlerde human approval gerekebilir.

---

## 52. Project-specific skills

Yalnızca dışarıdan skill tüketmekle kalmayalım.

Proje olgunlaştıkça kendi skill'lerimizi de oluşturalım.

Örneğin:

```text
project-architecture
database-conventions
project-testing
project-security
ui-patterns
feature-development
deployment
code-review
```

Bu skill'ler generic internet tavsiyeleri yerine doğrudan bizim projemizin gerçek kurallarını taşımalıdır.

---

## 53. AI onboarding

Projeye yeni bağlanan herhangi bir AI agent şu bootstrap sırasını uygulamalıdır:

```text
1. PROJECT_RULES
2. PROJECT_CONTEXT
3. CURRENT_STATE
4. MASTER_ROADMAP
5. Active Feature Specification
6. Relevant ADRs
7. Relevant Requirements
8. Relevant Tasks
9. Relevant Skills
10. Existing Code
11. Implementation
```

AI doğrudan source code'a girerek bağlamsız değişiklik yapmamalıdır.

---

## 54. Context hierarchy

AI'nın bilgi kaynaklarının önceliği:

```text
Current user instruction
↓
Project rules
↓
Recorded project decisions
↓
Current project state
↓
Existing code
↓
Official documentation
↓
Official skills
↓
Trusted third-party skills
↓
General AI knowledge
```

şeklinde olmalıdır.

---

## 55. AI memory stratejisi

Continuity tek katmanlı olmamalıdır.

Üç katman kullanılmalıdır:

```text
LEVEL 1
Git + project documentation
Deterministic source of truth

LEVEL 2
AI memory system
claude-mem vb.

LEVEL 3
Current conversation context
temporary working memory
```

Böylece bir katman kaybolursa proje bağlamı tamamen kaybolmaz.

---

## 56. AI hata önleme

AI:

```text
"Muhtemelen tamamdır."
```

yaklaşımı kullanmamalıdır.

Checklist üzerinden doğrulama yapılmalıdır.

Örnek:

```text
PHASE COMPLETION REPORT

Requirements             PASS
Architecture             PASS
Database                 PASS
Backend                  PASS
Frontend                 PASS
UI/UX                    PASS
Accessibility            PASS
Responsive               PASS
Security                 PASS
Edge Cases               PASS
Tests                    PASS
Documentation            PASS
Project State Updated    PASS

Remaining Issues:
NONE

STATUS:
DONE
```

Eksik varsa:

```text
STATUS:
NOT COMPLETE
```

olmalıdır.

---

## 57. Master Roadmap

İlk iş doğrudan application development olmayacaktır.

Önce:

```text
MASTER PROJECT ROADMAP
```

oluşturulmalıdır.

Örnek olarak:

```text
PHASE 00
Project Bootstrap & AI Infrastructure

PHASE 01
Requirements & Domain Analysis

PHASE 02
UX & User Flows

PHASE 03
System Architecture

PHASE 04
Database Architecture

PHASE 05
Authentication

PHASE 06
Authorization

PHASE 07
Core Domain

PHASE 08
File Infrastructure

PHASE 09
Background Jobs

PHASE 10
AI Infrastructure

PHASE 11
Search

PHASE 12
Notifications

PHASE 13
Administration

PHASE 14
Audit & Logging

PHASE 15
Security Hardening

PHASE 16
Testing Infrastructure

PHASE 17
Infrastructure & Deployment

PHASE 18
Monitoring

PHASE 19
Backup & Disaster Recovery

PHASE 20
Scalability Review

PHASE 21
Production Readiness
```

Ancak bu liste doğrudan kabul edilmemelidir.

Gerçek proje kapsamı analiz edilerek en doğru roadmap oluşturulmalıdır.

Her Phase için:

```text
Purpose
Scope
Questions
Dependencies
Deliverables
Acceptance Criteria
Risks
Status
```

bulunmalıdır.

---

## 58. Phase 00 – AI Development Infrastructure

İlk Phase içerisinde application feature geliştirmekten önce AI development infrastructure kurulmalıdır.

Minimum:

```text
PROJECT_RULES
PROJECT_CONTEXT
MASTER_ROADMAP
CURRENT_STATE
TASK SYSTEM
REQUIREMENT SYSTEM
ADR SYSTEM
SESSION HANDOFF
AI SKILL REGISTRY
AI MEMORY
COSS SKILL
SUPABASE SKILLS
VERCEL REACT SKILL
CLOUDFLARE SKILLS
Relevant Next.js Guidance
```

hazırlanmalıdır.

Böylece sonraki bütün geliştirme kontrollü bir ortamda gerçekleşir.

---

## 59. Kod ve veritabanı isimlendirme standardı

Projede kod, veritabanı, API ve teknik altyapı isimlendirmelerinde sektör standardı İngilizce terminoloji kullanılacaktır.

Kullanıcıya gösterilen içerik Türkçe olabilir ancak internal technical naming Türkçe olmamalıdır.

Temel ayrım:

```text
USER-FACING CONTENT
→ Türkçe olabilir

INTERNAL TECHNICAL NAMING
→ İngilizce olmalıdır
```

Bu kural:

- database,
- source code,
- API,
- environment variables,
- event names,
- queue names,
- storage keys,
- log fields,
- analytics events,
- test identifiers,
- infrastructure

dahil tüm teknik katmanlar için geçerlidir.

---

## 60. Türkçe teknik isimlendirme kullanılmaması

Aşağıdaki gibi isimler oluşturulmamalıdır:

```text
kullanicilar
kullanici_id
birim_fiyatlar
pozlar
dosyalar
olusturma_tarihi
guncelleme_tarihi
aktif_mi
silindi_mi
kullaniciAdi
dosyaYukle
birimFiyatHesapla
```

Bunların yerine sektör standardı İngilizce karşılıkları kullanılmalıdır:

```text
users
user_id
unit_prices
items
files
created_at
updated_at
is_active
deleted_at
username
uploadFile
calculateUnitPrice
```

AI hiçbir zaman proje domain'inin Türkçe olmasını gerekçe göstererek kod veya database isimlerini Türkçeleştirmemelidir.

---

## 61. Database naming convention

PostgreSQL / Supabase database yapısında varsayılan isimlendirme:

```text
snake_case
```

olacaktır.

Örnek:

```text
users
organizations
projects
unit_prices
price_lists
document_versions
project_members

user_id
organization_id
created_at
updated_at
deleted_at
external_id
is_active
```

Tablo isimleri mümkün olduğunca:

```text
plural nouns
```

şeklinde kullanılmalıdır.

Örneğin:

```text
users
projects
documents
organizations
```

Tercih edilmemesi gereken:

```text
user
project_table
tbl_users
t_user
users_table
```

gibi gereksiz prefix/suffix kullanımlarıdır.

---

## 62. Primary key standardı

Varsayılan primary key:

```text
id
```

olacaktır.

Örneğin:

```text
users.id
projects.id
documents.id
```

Foreign key ise ilişkili entity'yi açıkça belirtmelidir:

```text
user_id
project_id
document_id
organization_id
```

Şu tarz yapılar kullanılmamalıdır:

```text
userid
userID
id_user
fk_user
kullanici_id
```

---

## 63. Timestamp standardı

Standart timestamp alanları mümkün olduğunca:

```text
created_at
updated_at
deleted_at
```

olarak kullanılacaktır.

Gerektiğinde:

```text
published_at
processed_at
completed_at
started_at
expires_at
archived_at
```

gibi domain-specific isimler kullanılabilir.

Türkçe veya belirsiz isimlerden kaçınılmalıdır:

```text
tarih
islem_tarihi
kayit_tarihi
zaman
date1
date2
```

---

## 64. Boolean isimlendirme

Boolean alanlar değerlerinin boolean olduğunu açıkça ifade etmelidir.

Tercih edilen örnekler:

```text
is_active
is_verified
is_public
has_access
has_children
can_edit
should_retry
```

Kaçınılacak örnekler:

```text
active
status_flag
aktif
evet_hayir
flag1
control
```

Ancak boolean yerine gerçek bir state söz konusuysa boolean kullanılmamalıdır.

Örneğin:

```text
status = draft | active | archived
```

gibi bir yapı:

```text
is_draft
is_active
is_archived
```

şeklinde üç farklı boolean oluşturmaktan daha doğru olabilir.

---

## 65. Status ve enum naming

Status değerleri mümkün olduğunca açık ve İngilizce olmalıdır.

Örneğin:

```text
draft
pending
processing
completed
failed
cancelled
archived
```

Database enum veya application enum'larında Türkçe değerler kullanılmamalıdır.

Yanlış:

```text
bekliyor
tamamlandi
iptal
hata
```

Doğru:

```text
pending
completed
cancelled
failed
```

UI katmanı bunları gerektiğinde:

```text
pending → Bekliyor
completed → Tamamlandı
```

şeklinde kullanıcıya çevirebilir.

---

## 66. TypeScript naming convention

TypeScript içerisinde genel olarak sektör standardı kullanılmalıdır.

Değişkenler ve fonksiyonlar:

```text
camelCase
```

Örneğin:

```text
currentUser
projectId
unitPrice
documentVersion

getUser()
createProject()
calculateUnitPrice()
uploadDocument()
```

Component, class, type, interface ve enum isimleri:

```text
PascalCase
```

Örneğin:

```text
User
Project
DocumentUploader
UnitPriceService
ProjectRepository
CreateProjectInput
```

Constants gerektiğinde:

```text
UPPER_SNAKE_CASE
```

kullanabilir.

Örneğin:

```text
MAX_UPLOAD_SIZE
DEFAULT_PAGE_SIZE
SUPPORTED_FILE_TYPES
```

---

## 67. File ve directory naming

Dosya ve klasör isimlendirmesi proje genelinde tek standarda sahip olmalıdır.

Next.js ve kullanılan framework ekosisteminin yaygın convention'ları önceliklidir.

Örneğin seçilen standarda bağlı olarak:

```text
document-uploader.tsx
unit-price-service.ts
project-repository.ts
```

gibi `kebab-case` tercih edilebilir.

Aynı projede rastgele:

```text
DocumentUploader.tsx
document_uploader.tsx
documentUploader.tsx
document-uploader.tsx
```

karışımı oluşturulmamalıdır.

Proje başlangıcında tek convention belirlenmeli ve linting ile mümkün olduğunca enforce edilmelidir.

Framework tarafından özel isim gerektiren:

```text
page.tsx
layout.tsx
route.ts
loading.tsx
error.tsx
```

gibi dosyalarda framework convention'ı kullanılmalıdır.

---

## 68. API naming

API endpoint'lerinde de İngilizce ve tutarlı isimlendirme kullanılmalıdır.

Örneğin:

```text
/api/projects
/api/documents
/api/unit-prices
/api/organizations
```

Kaçınılmalıdır:

```text
/api/projeler
/api/dosyaGetir
/api/birimFiyatlar
/api/kullanici-sil
```

REST yaklaşımı kullanılıyorsa resource-oriented tasarım tercih edilmelidir.

Örneğin:

```text
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PATCH  /api/projects/:id
DELETE /api/projects/:id
```

yerine gereksiz action endpoint'leri oluşturulmamalıdır:

```text
/getProjects
/createProject
/updateProject
/deleteProject
```

Ancak domain action gerçekten bir resource CRUD işlemi değilse açıklayıcı action endpoint kullanılabilir.

---

## 69. JSON ve DTO naming

API request/response payload'larında:

```text
camelCase
```

tercih edilmelidir.

Örneğin:

```json
{
  "projectId": "...",
  "unitPrice": 1500,
  "createdAt": "..."
}
```

Database:

```text
project_id
unit_price
created_at
```

Application/API:

```text
projectId
unitPrice
createdAt
```

şeklinde olabilir.

Bu dönüşüm merkezi ve tutarlı yapılmalıdır.

---

## 70. Domain terminology

Domain içerisindeki her önemli kavram için tek bir canonical İngilizce terim belirlenmelidir.

Aynı kavram farklı yerlerde farklı isimlerle temsil edilmemelidir.

Örneğin bir kavram için:

```text
organization
```

seçildiyse başka yerlerde rastgele:

```text
company
firm
institution
organization
```

kullanılmamalıdır.

Önce domain glossary oluşturulmalıdır.

Önerilen dosya:

```text
/docs/domain/GLOSSARY.md
```

Burada:

```text
Turkish Term
Canonical English Term
Definition
Allowed Alternatives
Forbidden Alternatives
Notes
```

tutulmalıdır.

Örneğin:

```text
Yaklaşık Maliyet
→ Cost Estimate

Birim Fiyat
→ Unit Price

Poz
→ Item / Work Item
```

Ancak özellikle kamu ihale, inşaat ve birim fiyat gibi sektörel kavramlarda İngilizce karşılık tahmin edilmemelidir.

Domain anlamını en doğru temsil eden terim araştırılmalı ve proje genelinde sabitlenmelidir.

---

## 71. Naming Decision prensibi

Bir kavramın İngilizce karşılığı belirsizse AI kendi başına rastgele isim seçmemelidir.

Şu süreç uygulanmalıdır:

```text
Domain concept
↓
Meaning analysis
↓
Industry terminology
↓
Candidate terms
↓
Decision
↓
GLOSSARY.md
```

Karar verildikten sonra proje genelinde aynı isim kullanılmalıdır.

Bu özellikle:

- ihale,
- yaklaşık maliyet,
- poz,
- rayiç,
- analiz,
- pursantaj,
- hakediş,
- icmal,
- metraj

gibi doğrudan ve kusursuz İngilizce karşılığı her zaman açık olmayan domain terimleri için önemlidir.

---

## 72. User-facing localization

Teknik isimlerin İngilizce olması uygulamanın İngilizce olması gerektiği anlamına gelmez.

Kullanıcı arayüzü Türkçe olabilir.

Örneğin internal değer:

```text
unitPrice
```

UI:

```text
Birim Fiyat
```

Internal status:

```text
processing
```

UI:

```text
İşleniyor
```

Database:

```text
created_at
```

UI:

```text
Oluşturulma Tarihi
```

olabilir.

Bu ayrım kesinlikle korunmalıdır.

---

## 73. Localization architecture

Kullanıcıya gösterilen metinlerin doğrudan business logic veya database içerisine gömülmemesi tercih edilmelidir.

Uygulamanın kapsamına uygunsa localization/i18n altyapısı düşünülmelidir.

Örneğin:

```text
project.create.title
project.create.success
document.upload.error
```

gibi semantic translation key'leri kullanılabilir.

Bu sayede gelecekte:

```text
tr
en
```

ve başka diller eklenebilir.

Ancak mevcut ihtiyaç gerektirmiyorsa gereksiz i18n overengineering yapılmamalıdır.

---

## 74. Infrastructure naming

Docker, Cloudflare, GitHub, deployment, queue ve diğer altyapı isimleri de İngilizce olmalıdır.

Örneğin:

```text
production
staging
development

document-processing
email-notifications
price-import-worker

DATABASE_URL
SUPABASE_URL
R2_BUCKET_NAME
R2_ACCESS_KEY_ID
```

Kaçınılmalıdır:

```text
canli
test_sunucu
dosya_isleme
VERITABANI_URL
```

---

## 75. Event naming

Event-driven yapı kullanıldığında event isimlendirmesi de standardize edilmelidir.

Örneğin:

```text
document.created
document.updated
document.deleted

project.created
project.archived

import.started
import.completed
import.failed
```

Aynı event farklı yerlerde:

```text
documentCreated
new_document
document-added
```

şeklinde farklı isimlerle temsil edilmemelidir.

---

## 76. Naming anti-pattern'leri

AI aşağıdaki türde isimler oluşturmamalıdır:

```text
data
data2
temp
tempData
finalData
newData
item2
value
result2
test123
helper
utils2
common2
misc
thing
obj
arr
x
y
```

Kısa scope içerisindeki klasik iterator gibi istisnalar dışında değişken adı neyi temsil ettiğini anlatmalıdır.

Örneğin:

```text
data
```

yerine:

```text
projectMembers
unitPriceEntries
uploadedDocuments
```

kullanılmalıdır.

---

## 77. Generic utility problemi

AI her ortak görünen kodu:

```text
utils
helpers
common
```

altına taşımamalıdır.

Önce kodun domain veya feature ownership'i belirlenmelidir.

Örneğin:

```text
features/documents/lib/
features/projects/lib/
domain/pricing/
```

gibi anlamlı sahiplik:

```text
/lib/utilsEverything.ts
```

yaklaşımından daha doğrudur.

---

## 78. Database column semantics

Kolon isimleri yalnızca teknik olarak kısa olduğu için belirsiz bırakılmamalıdır.

Yanlış:

```text
type
value
data
status
date
name
```

Bu isimler ancak entity bağlamında gerçekten açık ve tek anlamlıysa kullanılabilir.

Aksi durumda:

```text
document_type
price_value
processing_status
effective_date
display_name
```

gibi daha semantic isimler kullanılmalıdır.

---

## 79. Database abbreviation policy

Gereksiz abbreviation kullanılmamalıdır.

Kaçınılacak örnekler:

```text
usr
proj
doc_ver
org_id
crt_at
upd_at
```

Tercih:

```text
user
project
document_version
organization_id
created_at
updated_at
```

Ancak sektörde evrensel hale gelmiş kısaltmalar:

```text
id
url
api
ip
http
uuid
```

kullanılabilir.

---

## 80. Naming review

Yeni:

- database table,
- column,
- domain entity,
- API resource,
- service,
- component,
- important function

oluşturulurken AI isimlendirmeyi ayrıca değerlendirmelidir.

Kontrol listesi:

```text
Is it English?
Is it industry-standard?
Is the meaning unambiguous?
Does a canonical project term already exist?
Does it follow project casing conventions?
Does it unnecessarily contain implementation details?
Is it too generic?
Is it unnecessarily abbreviated?
Will the name still make sense one year later?
```

Bu kontrollerden geçmeyen isim kullanılmamalıdır.

---

## 81. Refactoring existing naming inconsistencies

Projede mevcut kod veya veritabanı incelendiğinde Türkçe veya standart dışı isimler bulunursa doğrudan kontrolsüz rename yapılmamalıdır.

Önce:

```text
Existing Name
Recommended Name
References
Database Impact
API Impact
Migration Requirement
Backward Compatibility
Risk
```

analizi yapılmalıdır.

Ardından kontrollü migration/refactor planı hazırlanmalıdır.

Özellikle production database kolonları ve tabloları doğrudan rename edilmemelidir.

Migration ve rollback stratejisi bulunmalıdır.

---

## 82. Naming source of truth

Projenin naming standardı repository içerisinde dokümante edilmelidir.

Önerilen dosyalar:

```text
/docs/standards/NAMING_CONVENTIONS.md
/docs/domain/GLOSSARY.md
```

`NAMING_CONVENTIONS.md`:

```text
Database
TypeScript
React
Files
Directories
API
Events
Environment Variables
Infrastructure
Tests
```

standartlarını içermelidir.

`GLOSSARY.md` ise domain vocabulary için source of truth olacaktır.

---

## 83. AI için kesin naming kuralı

AI modelleri aşağıdaki kuralı değişmez proje kuralı olarak kabul etmelidir:

```text
CODE AND INFRASTRUCTURE
=
ENGLISH

DATABASE SCHEMA
=
ENGLISH + snake_case

TYPESCRIPT
=
ENGLISH + ecosystem conventions

USER INTERFACE
=
localized, primarily Turkish

DOMAIN TERMINOLOGY
=
canonical terminology defined in GLOSSARY.md
```

Türkçe variable, function, class, table, column veya API isimleri oluşturulmamalıdır.

Herhangi bir isim konusunda şüphe varsa uygulanmadan önce mevcut glossary ve naming convention kontrol edilmelidir.

---

## 84. Naming Definition of Done

Bir feature'ın Definition of Done kontrolüne ayrıca:

```text
Naming conventions              PASS
Domain terminology              PASS
Database naming                 PASS
Code naming                     PASS
API naming                      PASS
No Turkish internal names       PASS
No ambiguous abbreviations      PASS
Glossary updated if required    PASS
```

eklenmelidir.

Bu kontroller tamamlanmadan feature tamamen DONE sayılmamalıdır.

---

## 85. İlk görev

Şu anda doğrudan application kodu yazmaya başlama.

Öncelikle mevcut proje kapsamını eksiksiz analiz et.

Ardından:

1. Bütün ana modülleri çıkar.
2. Modüller arasındaki dependency graph'ı oluştur.
3. MASTER ROADMAP oluştur.
4. Phase ve Subphase'leri belirle.
5. Her Phase için Definition of Done oluştur.
6. Requirement ID standardını belirle.
7. Feature ID standardını belirle.
8. Task ID standardını belirle.
9. ADR standardını belirle.
10. Project state sistemini oluştur.
11. Session continuity sistemini oluştur.
12. AI skill registry sistemini oluştur.
13. Kullanacağımız mevcut AI skill'lerini audit et.
14. Gerekli skill'lerin güvenilir kaynaklarını belirle.
15. Project-specific skill ihtiyacını belirle.
16. UI/UX design-system kurallarını oluştur.
17. COSS kullanım kurallarını oluştur.
18. devl.dev kullanım kurallarını oluştur.
19. Naming convention standardını oluştur.
20. Domain glossary başlangıç yapısını oluştur.
21. İlk Phase için cevaplanması gereken soruları çıkar.
22. Phase 00'ın Definition of Done kriterlerini oluştur.

Son durumda:

```text
CURRENT PHASE:
PHASE 00

CURRENT SUBPHASE:
PROJECT BOOTSTRAP

STATUS:
QUESTIONS_PENDING
```

olarak proje durumunu kaydet.

Ben gerekli soruları cevapladıktan sonra Phase 00 ilerletilecektir.

Hiçbir Phase atlanmayacaktır.

Hiçbir kritik eksik sessizce bırakılmayacaktır.

Hiçbir iş gerçekten tamamlanmadan DONE yapılmayacaktır.

Her session sonunda proje durumu güncellenecektir.

Farklı AI modelleri, IDE'ler veya session'lar kullanılsa dahi proje:

```text
tek bir disiplinli mühendislik ekibi
```

tarafından kesintisiz geliştiriliyormuş gibi devam etmelidir.
