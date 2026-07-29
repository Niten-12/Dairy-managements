import {
    H1,
    H2,
    H3,
    Text,
    Stack,
    Row,
    Grid,
    Card,
    CardHeader,
    CardBody,
    Stat,
    Pill,
    Button,
    Divider,
    Table,
    Callout,
    CollapsibleSection,
    Swatch,
    UsageBar,
    TodoListCard,
    computeDAGLayout,
    useHostTheme,
    useCanvasState,
  } from "cursor/canvas";
  
  type ViewTab = "current" | "target" | "gaps" | "roadmap";
  
  const CURRENT_NODES: Record<string, { label: string; sub: string; tone: "blue" | "green" | "purple" | "orange" | "gray" | "pink" | "yellow" }> = {
    browser: { label: "Browser", sub: "React 18 + Vite", tone: "blue" },
    proxy: { label: "Nginx / Vite", sub: "Reverse proxy /api", tone: "gray" },
    backend: { label: "Spring Boot API", sub: "Java 21 · JWT · 2FA", tone: "green" },
    postgres: { label: "PostgreSQL 16", sub: "Flyway migrations", tone: "purple" },
    uploads: { label: "Local disk", sub: "/uploads volume", tone: "orange" },
    sms: { label: "Fast2SMS", sub: "OTP delivery", tone: "pink" },
  };
  
  const CURRENT_EDGES = [
    { from: "browser", to: "proxy" },
    { from: "proxy", to: "backend" },
    { from: "backend", to: "postgres" },
    { from: "backend", to: "uploads" },
    { from: "backend", to: "sms" },
  ];
  
  const TARGET_NODES: Record<string, { label: string; sub: string; tone: "blue" | "green" | "purple" | "orange" | "gray" | "pink" | "yellow"; isNew?: boolean }> = {
    browser: { label: "Browser / CDN", sub: "Static assets at edge", tone: "blue" },
    gateway: { label: "API Gateway", sub: "Rate limit · WAF · routing", tone: "yellow", isNew: true },
    backend: { label: "Spring Boot API", sub: "Stateless services", tone: "green" },
    redis: { label: "Redis", sub: "Cache · sessions · OTP", tone: "orange", isNew: true },
    postgres: { label: "PostgreSQL", sub: "Primary + read replica", tone: "purple" },
    s3: { label: "Object storage", sub: "S3 / MinIO images", tone: "pink", isNew: true },
    observability: { label: "Observability", sub: "Prometheus · Grafana · logs", tone: "gray", isNew: true },
    queue: { label: "Message queue", sub: "SMS · email · async jobs", tone: "yellow", isNew: true },
  };
  
  const TARGET_EDGES = [
    { from: "browser", to: "gateway" },
    { from: "gateway", to: "backend" },
    { from: "backend", to: "redis" },
    { from: "backend", to: "postgres" },
    { from: "backend", to: "s3" },
    { from: "backend", to: "queue" },
    { from: "backend", to: "observability" },
  ];
  
  const MATURITY = {
    current: 42,
    target: 100,
  };
  
  const FEATURES = [
    { area: "Public storefront", status: "Built", path: "React → /api/products → PostgreSQL", tone: "success" as const },
    { area: "Auth (email + OTP + 2FA)", status: "Built", path: "React → /api/auth → users table", tone: "success" as const },
    { area: "Customer orders", status: "Built", path: "React → /api/orders → orders table", tone: "success" as const },
    { area: "Admin CRUD", status: "Built", path: "React → /api/admin/* → DB", tone: "success" as const },
    { area: "Farmer milk collection", status: "Built", path: "React → /api/farmer → milk_collections", tone: "success" as const },
    { area: "Delivery portal", status: "Built", path: "React → /api/delivery → orders", tone: "success" as const },
    { area: "Shopping cart", status: "Local only", path: "Browser localStorage (no DB until checkout)", tone: "warning" as const },
    { area: "Brand name setting", status: "Local only", path: "Browser localStorage (not persisted to DB)", tone: "warning" as const },
    { area: "CI/CD pipeline", status: "Missing", path: "No GitHub Actions / deploy automation", tone: "danger" as const },
    { area: "API documentation", status: "Missing", path: "No OpenAPI / Swagger", tone: "danger" as const },
    { area: "Monitoring & alerts", status: "Missing", path: "No Prometheus, Grafana, or APM", tone: "danger" as const },
    { area: "Centralized logging", status: "Missing", path: "No ELK / Loki / CloudWatch", tone: "danger" as const },
    { area: "Caching layer", status: "Missing", path: "No Redis — every read hits PostgreSQL", tone: "danger" as const },
    { area: "Object storage", status: "Missing", path: "Images on local disk, not S3/MinIO", tone: "danger" as const },
    { area: "Frontend tests", status: "Missing", path: "Playwright installed but no suite", tone: "danger" as const },
  ];
  
  const ROADMAP_PHASES = [
    {
      id: "p1",
      title: "Phase 1 — Foundation & quality",
      window: "Weeks 1–4",
      priority: "Critical",
      items: [
        { id: "p1-1", content: "Add GitHub Actions: build backend (Maven), frontend (Vite), run tests on every PR", status: "pending" as const },
        { id: "p1-2", content: "Enable Spring Boot Actuator (/health, /info) and wire Docker healthchecks to it", status: "pending" as const },
        { id: "p1-3", content: "Add OpenAPI 3 via springdoc-openapi; publish Swagger UI at /swagger-ui", status: "pending" as const },
        { id: "p1-4", content: "Fix farmer/delivery API path double-/api prefix bug in frontend", status: "pending" as const },
        { id: "p1-5", content: "Expand backend integration tests for orders, products, and auth flows", status: "pending" as const },
        { id: "p1-6", content: "Add Playwright E2E smoke tests: login, browse products, place order", status: "pending" as const },
        { id: "p1-7", content: "Update README and architecture docs to match current feature set", status: "pending" as const },
      ],
    },
    {
      id: "p2",
      title: "Phase 2 — Security hardening",
      window: "Weeks 5–8",
      priority: "High",
      items: [
        { id: "p2-1", content: "Move JWT to httpOnly Secure cookies (replace localStorage token storage)", status: "pending" as const },
        { id: "p2-2", content: "Add rate limiting on /api/auth/* and /api/auth/otp/* (Bucket4j or gateway)", status: "pending" as const },
        { id: "p2-3", content: "Store secrets in vault (AWS Secrets Manager / Doppler) — remove .env from runtime", status: "pending" as const },
        { id: "p2-4", content: "Add CSRF protection for cookie-based auth; tighten CORS to known origins", status: "pending" as const },
        { id: "p2-5", content: "Security headers via Nginx (HSTS, CSP, X-Frame-Options)", status: "pending" as const },
        { id: "p2-6", content: "Audit log all admin mutations; add immutable log retention policy", status: "pending" as const },
      ],
    },
    {
      id: "p3",
      title: "Phase 3 — Scalability & resilience",
      window: "Weeks 9–14",
      priority: "High",
      items: [
        { id: "p3-1", content: "Introduce Redis: cache public product catalog, OTP codes, session blacklist", status: "pending" as const },
        { id: "p3-2", content: "Migrate uploads to S3-compatible storage (AWS S3 or MinIO in Docker)", status: "pending" as const },
        { id: "p3-3", content: "Add API Gateway (Kong / AWS API Gateway / Spring Cloud Gateway)", status: "pending" as const },
        { id: "p3-4", content: "Separate dev / staging / prod environments with isolated databases", status: "pending" as const },
        { id: "p3-5", content: "Database connection pooling tuning + read replica for reporting queries", status: "pending" as const },
        { id: "p3-6", content: "Persist cart and brand settings to DB (optional multi-device sync)", status: "pending" as const },
      ],
    },
    {
      id: "p4",
      title: "Phase 4 — Observability & ops",
      window: "Weeks 15–18",
      priority: "Medium",
      items: [
        { id: "p4-1", content: "Expose Micrometer metrics → Prometheus; build Grafana dashboards", status: "pending" as const },
        { id: "p4-2", content: "Structured JSON logging + centralized log aggregation (Loki or ELK)", status: "pending" as const },
        { id: "p4-3", content: "Error tracking (Sentry) on frontend and backend", status: "pending" as const },
        { id: "p4-4", content: "Distributed tracing (OpenTelemetry + Jaeger) for order and auth flows", status: "pending" as const },
        { id: "p4-5", content: "Define SLOs: API p95 latency, error rate, uptime; configure alerting", status: "pending" as const },
      ],
    },
    {
      id: "p5",
      title: "Phase 5 — Enterprise features",
      window: "Weeks 19–26",
      priority: "Strategic",
      items: [
        { id: "p5-1", content: "Payment gateway integration (Razorpay / Stripe) with webhook idempotency", status: "pending" as const },
        { id: "p5-2", content: "Async notification service (SMS, email, push) via message queue", status: "pending" as const },
        { id: "p5-3", content: "Role-based feature flags and admin-configurable business rules", status: "pending" as const },
        { id: "p5-4", content: "Multi-warehouse inventory and delivery route assignment", status: "pending" as const },
        { id: "p5-5", content: "Data export, GDPR compliance, and automated backup/restore drills", status: "pending" as const },
        { id: "p5-6", content: "Optional: split into microservices only where bounded contexts justify it", status: "pending" as const },
      ],
    },
  ];
  
  function ArchitectureDiagram({
    nodes,
    edges,
    width = 720,
  }: {
    nodes: Record<string, { label: string; sub: string; tone: "blue" | "green" | "purple" | "orange" | "gray" | "pink" | "yellow"; isNew?: boolean }>;
    edges: Array<{ from: string; to: string }>;
    width?: number;
  }) {
    const theme = useHostTheme();
    const layout = computeDAGLayout({
      nodes: Object.keys(nodes).map((id) => ({ id })),
      edges,
      direction: "vertical",
      nodeWidth: 168,
      nodeHeight: 52,
      rankGap: 56,
      nodeGap: 24,
      padding: 20,
    });
  
    const scale = Math.min(1, (width - 32) / layout.width);
    const svgW = layout.width * scale;
    const svgH = layout.height * scale;
  
    return (
      <div style={{ overflowX: "auto", width: "100%" }}>
        <svg width={svgW} height={svgH} viewBox={`0 0 ${layout.width} ${layout.height}`} role="img" aria-label="Architecture diagram">
          {layout.edges.map((edge) => (
            <line
              key={`${edge.from}-${edge.to}`}
              x1={edge.sourceX}
              y1={edge.sourceY}
              x2={edge.targetX}
              y2={edge.targetY}
              stroke={theme.stroke.secondary}
              strokeWidth={1.5}
              markerEnd="url(#arrowhead)"
            />
          ))}
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill={theme.stroke.secondary} />
            </marker>
          </defs>
          {layout.nodes.map((node) => {
            const meta = nodes[node.id];
            if (!meta) return null;
            return (
              <g key={node.id}>
                <rect
                  x={node.x}
                  y={node.y}
                  width={168}
                  height={52}
                  rx={4}
                  fill={theme.bg.elevated}
                  stroke={meta.isNew ? theme.accent.primary : theme.stroke.primary}
                  strokeWidth={meta.isNew ? 2 : 1}
                  strokeDasharray={meta.isNew ? "4 3" : undefined}
                />
                <text x={node.x + 84} y={node.y + 20} textAnchor="middle" fill={theme.text.primary} fontSize={12} fontWeight={600}>
                  {meta.label}
                </text>
                <text x={node.x + 84} y={node.y + 38} textAnchor="middle" fill={theme.text.tertiary} fontSize={10}>
                  {meta.sub}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  }
  
  function TabBar({ active, onChange }: { active: ViewTab; onChange: (t: ViewTab) => void }) {
    const tabs: Array<{ id: ViewTab; label: string }> = [
      { id: "current", label: "Current architecture" },
      { id: "target", label: "Target (enterprise)" },
      { id: "gaps", label: "Gap analysis" },
      { id: "roadmap", label: "Roadmap" },
    ];
    return (
      <Row gap={8} wrap>
        {tabs.map((tab) => (
          <Button key={tab.id} variant={active === tab.id ? "primary" : "ghost"} onClick={() => onChange(tab.id)}>
            {tab.label}
          </Button>
        ))}
      </Row>
    );
  }
  
  export default function DairyEnterpriseRoadmap() {
    const [activeTab, setActiveTab] = useCanvasState<ViewTab>("activeTab", "current");
    const [expandedPhase, setExpandedPhase] = useCanvasState<string>("expandedPhase", "p1");
  
    const builtCount = FEATURES.filter((f) => f.status === "Built").length;
    const partialCount = FEATURES.filter((f) => f.status === "Local only").length;
    const missingCount = FEATURES.filter((f) => f.status === "Missing").length;
  
    return (
      <Stack gap={20}>
        <Stack gap={6}>
          <H1>Dairy Management — Enterprise Architecture Guide</H1>
          <Text tone="secondary">
            Current stack: React + Spring Boot + PostgreSQL (no API gateway). Dashed-border nodes in the target view are recommended additions.
          </Text>
          <Text size="small" tone="tertiary">
            Source: codebase analysis · Dairy Management repo · July 2026
          </Text>
        </Stack>
  
        <Grid columns={4} gap={12}>
          <Stat label="Enterprise maturity" value={`${MATURITY.current}%`} tone="warning" />
          <Stat label="Features built" value={String(builtCount)} tone="success" />
          <Stat label="Partial / local-only" value={String(partialCount)} tone="warning" />
          <Stat label="Missing (enterprise)" value={String(missingCount)} tone="danger" />
        </Grid>
  
        <Card>
          <CardHeader title="Maturity vs enterprise target" trailing={<Text size="small" tone="tertiary">{MATURITY.current} / {MATURITY.target}</Text>} />
          <CardBody>
            <UsageBar
              total={MATURITY.target}
              topLeftLabel={`${MATURITY.current}% enterprise-ready`}
              topRightLabel="Target: 100%"
              segments={[
                { id: "built", value: 28, color: "green" },
                { id: "partial", value: 6, color: "yellow" },
                { id: "security", value: 4, color: "orange" },
                { id: "gap", value: MATURITY.current - 38, color: "blue" },
              ]}
            />
            <Text size="small" tone="tertiary" style={{ marginTop: 8 }}>
              Green = core features shipped · Yellow = local-only gaps · Orange = security debt · Blue = infra/ops gaps
            </Text>
          </CardBody>
        </Card>
  
        <TabBar active={activeTab} onChange={setActiveTab} />
  
        {activeTab === "current" && (
          <Stack gap={16}>
            <Card>
              <CardHeader title="Current request flow" subtitle="Frontend never connects to PostgreSQL directly" />
              <CardBody>
                <ArchitectureDiagram nodes={CURRENT_NODES} edges={CURRENT_EDGES} />
                <Divider />
                <Grid columns={2} gap={16}>
                  <Stack gap={8}>
                    <H3>Layer 1 — Client</H3>
                    <Text size="small" tone="secondary">React SPA with 5 role portals (public, customer, farmer, delivery, admin). Axios calls /api. Cart and brand stored in localStorage.</Text>
                  </Stack>
                  <Stack gap={8}>
                    <H3>Layer 2 — Proxy</H3>
                    <Text size="small" tone="secondary">Nginx (Docker) or Vite dev server forwards /api and /uploads to Spring Boot. Not a business gateway — no auth, rate limits, or routing rules.</Text>
                  </Stack>
                  <Stack gap={8}>
                    <H3>Layer 3 — Backend</H3>
                    <Text size="small" tone="secondary">12 REST controllers, JWT filter, role-based access, 7 JPA repositories, Flyway migrations, local file storage.</Text>
                  </Stack>
                  <Stack gap={8}>
                    <H3>Layer 4 — Data</H3>
                    <Text size="small" tone="secondary">PostgreSQL 16 with 7 tables: users, products, categories, orders, order_items, milk_collections, audit_logs.</Text>
                  </Stack>
                </Grid>
              </CardBody>
            </Card>
  
            <Card>
              <CardHeader title="Current components inventory" />
              <CardBody>
                <Table
                  headers={["Component", "Technology", "Role"]}
                  rows={[
                    [<Text weight="medium">Frontend</Text>, "React 18, Vite 5, React Router 6", "UI, routing, i18n (EN/TE)"],
                    [<Text weight="medium">HTTP client</Text>, "Axios", "JWT in Authorization header"],
                    [<Text weight="medium">Reverse proxy</Text>, "Nginx / Vite proxy", "Forward /api to backend"],
                    [<Text weight="medium">API server</Text>, "Spring Boot 3.2, Java 21", "Business logic + security"],
                    [<Text weight="medium">ORM</Text>, "Spring Data JPA", "SQL generation + entities"],
                    [<Text weight="medium">Database</Text>, "PostgreSQL 16 + Flyway", "Persistent storage"],
                    [<Text weight="medium">Auth</Text>, "JWT + BCrypt + TOTP + OTP", "Stateless sessions"],
                    [<Text weight="medium">SMS</Text>, "Fast2SMS API", "OTP delivery"],
                    [<Text weight="medium">File storage</Text>, "Docker volume /uploads", "Product/category images"],
                    [<Text weight="medium">Containerization</Text>, "Docker Compose", "3 services: postgres, backend, frontend"],
                  ]}
                />
              </CardBody>
            </Card>
          </Stack>
        )}
  
        {activeTab === "target" && (
          <Stack gap={16}>
            <Callout tone="info" title="Target architecture principle">
              Keep the modular monolith until traffic or team size justifies splitting. Add gateway, cache, object storage, and observability around the existing Spring Boot core.
            </Callout>
            <Card>
              <CardHeader title="Enterprise target architecture" subtitle="Dashed nodes = new components to add" />
              <CardBody>
                <ArchitectureDiagram nodes={TARGET_NODES} edges={TARGET_EDGES} />
              </CardBody>
            </Card>
            <Grid columns={2} gap={12}>
              <Card>
                <CardHeader title="Why an API Gateway?" />
                <CardBody>
                  <Stack gap={6}>
                    <Text size="small">Centralize rate limiting, TLS termination, request logging, and API versioning before traffic hits Spring Boot.</Text>
                    <Text size="small">Industry options: Kong, AWS API Gateway, NGINX Plus, or Spring Cloud Gateway.</Text>
                  </Stack>
                </CardBody>
              </Card>
              <Card>
                <CardHeader title="Why Redis?" />
                <CardBody>
                  <Stack gap={6}>
                    <Text size="small">Cache hot reads (product catalog, categories). Store OTP codes with TTL. Optional JWT denylist for logout.</Text>
                    <Text size="small">Reduces PostgreSQL load under concurrent storefront traffic.</Text>
                  </Stack>
                </CardBody>
              </Card>
              <Card>
                <CardHeader title="Why object storage?" />
                <CardBody>
                  <Stack gap={6}>
                    <Text size="small">Local disk uploads do not scale across multiple backend instances. S3/MinIO enables CDN, backup, and horizontal scaling.</Text>
                  </Stack>
                </CardBody>
              </Card>
              <Card>
                <CardHeader title="Why observability stack?" />
                <CardBody>
                  <Stack gap={6}>
                    <Text size="small">Enterprise ops requires metrics (Prometheus), dashboards (Grafana), structured logs, and error tracking (Sentry) with alerting on SLO breaches.</Text>
                  </Stack>
                </CardBody>
              </Card>
            </Grid>
          </Stack>
        )}
  
        {activeTab === "gaps" && (
          <Stack gap={16}>
            <Callout tone="warning" title="Key finding">
              There is no API Gateway today. Nginx/Vite only proxy requests — all business logic, auth, and database access live in Spring Boot.
            </Callout>
            <Card>
              <CardHeader title="Feature & infrastructure gap matrix" count={FEATURES.length} />
              <CardBody style={{ padding: 0 }}>
                <Table
                  headers={["Area", "Status", "Current connection path"]}
                  rowTones={FEATURES.map((f) => f.tone)}
                  rows={FEATURES.map((f) => [
                    f.area,
                    <Pill tone={f.tone === "success" ? "success" : f.tone === "warning" ? "warning" : "danger"} size="small">{f.status}</Pill>,
                    <Text size="small" tone="secondary">{f.path}</Text>,
                  ])}
                />
              </CardBody>
            </Card>
            <Grid columns={2} gap={12}>
              <Card>
                <CardHeader title="Security gaps" />
                <CardBody>
                  <Stack gap={4}>
                    {[
                      "JWT stored in localStorage (XSS risk)",
                      "No rate limiting on auth/OTP endpoints",
                      "Secrets in .env file, not a vault",
                      "No WAF or DDoS protection",
                      "CSRF disabled (acceptable for Bearer JWT, risky if moving to cookies)",
                    ].map((item) => (
                      <Row key={item} gap={8} align="start">
                        <Swatch color="orange" />
                        <Text size="small">{item}</Text>
                      </Row>
                    ))}
                  </Stack>
                </CardBody>
              </Card>
              <Card>
                <CardHeader title="Operational gaps" />
                <CardBody>
                  <Stack gap={4}>
                    {[
                      "No CI/CD — manual build and deploy",
                      "No staging environment",
                      "No health/metrics endpoints exposed",
                      "No automated database backup strategy",
                      "README outdated vs actual feature set",
                    ].map((item) => (
                      <Row key={item} gap={8} align="start">
                        <Swatch color="purple" />
                        <Text size="small">{item}</Text>
                      </Row>
                    ))}
                  </Stack>
                </CardBody>
              </Card>
            </Grid>
          </Stack>
        )}
  
        {activeTab === "roadmap" && (
          <Stack gap={12}>
            <Callout tone="success" title="Recommended approach">
              Execute phases sequentially. Phase 1–2 deliver the highest ROI before scaling infrastructure in Phase 3–4.
            </Callout>
            {ROADMAP_PHASES.map((phase) => (
              <CollapsibleSection
                key={phase.id}
                title={phase.title}
                count={phase.items.length}
                leading={<Swatch color={phase.priority === "Critical" ? "orange" : phase.priority === "High" ? "blue" : phase.priority === "Medium" ? "green" : "purple"} />}
                trailing={<Pill size="small">{phase.window}</Pill>}
                defaultOpen={expandedPhase === phase.id}
              >
                <Stack gap={8} style={{ paddingLeft: 8 }}>
                  <Row gap={8}>
                    <Pill tone="info" size="small">Priority: {phase.priority}</Pill>
                  </Row>
                  <TodoListCard
                    todos={phase.items}
                    defaultExpanded
                    onTodoClick={(todo) => {
                      setExpandedPhase(phase.id);
                    }}
                  />
                </Stack>
              </CollapsibleSection>
            ))}
            <Card>
              <CardHeader title="Quick wins (start this week)" />
              <CardBody>
                <Table
                  headers={["Action", "Effort", "Impact"]}
                  rows={[
                    ["Fix farmer/delivery API paths (/api/api bug)", "1 hour", "Unblocks farmer & delivery portals"],
                    ["Add springdoc-openapi + Swagger UI", "2 hours", "Team onboarding + API contract clarity"],
                    ["GitHub Actions: mvn test + npm build", "4 hours", "Prevents regressions on every PR"],
                    ["Spring Actuator /actuator/health", "1 hour", "Proper Docker healthchecks"],
                    ["Move brand name to DB settings table", "4 hours", "Consistent branding across devices"],
                  ]}
                />
              </CardBody>
            </Card>
          </Stack>
        )}
      </Stack>
    );
  }
  