# Careers API

Replace `https://example.com`, `PROJECT_ID`, `CAREER_ID`, and `API_TOKEN` with your values.

```bash
curl https://example.com/bridge/api.v1/project/PROJECT_ID/careers
curl https://example.com/bridge/api.v1/project/PROJECT_ID/careers/CAREER_ID
```

Authenticated requests use the same project and token headers as the members API:

```bash
curl https://example.com/bridge/api.v1/careers \
  -H 'x-project: PROJECT_ID' \
  -H 'token: API_TOKEN'

curl -X POST https://example.com/bridge/api.v1/careers \
  -H 'x-project: PROJECT_ID' \
  -H 'token: API_TOKEN' \
  -H 'content-type: application/json' \
  --data '{"title":"Senior Software Engineer","location":"Remote","type":"Full-time","description":"Build our product.","status":"Open","qualifications":["TypeScript"],"openings":1}'

curl https://example.com/bridge/api.v1/careers/CAREER_ID \
  -H 'x-project: PROJECT_ID' -H 'token: API_TOKEN'

curl -X PATCH https://example.com/bridge/api.v1/careers/CAREER_ID \
  -H 'x-project: PROJECT_ID' -H 'token: API_TOKEN' \
  -H 'content-type: application/json' --data '{"status":"Closed"}'

curl -X DELETE https://example.com/bridge/api.v1/careers/CAREER_ID \
  -H 'x-project: PROJECT_ID' -H 'token: API_TOKEN'
```
