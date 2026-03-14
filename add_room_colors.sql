-- 기존 rooms 테이블에 예약/뱃지 색상 구분을 위한 color 컬럼을 추가합니다.
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS color text;

-- (선택 사항) 이미 존재하는 숙소가 있다면 기본값으로 회색(#6B7280) 등을 일괄 적용하고 싶을 때 주석을 풀고 사용하세요
-- UPDATE rooms SET color = '#6B7280' WHERE color IS NULL;
