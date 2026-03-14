-- rooms 테이블을 사용자가 조회할 수 있도록 RLS 정책 추가
CREATE POLICY "Users can view their own business rooms" ON rooms FOR SELECT USING (
  business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
);

CREATE POLICY "Users can insert rooms for their business" ON rooms FOR INSERT WITH CHECK (
  business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update their business rooms" ON rooms FOR UPDATE USING (
  business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
);

CREATE POLICY "Users can delete their business rooms" ON rooms FOR DELETE USING (
  business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
);

-- reservations 테이블 RLS 정책 (추후 예약 관리 등을 위해)
CREATE POLICY "Users can view their reservations" ON reservations FOR SELECT USING (
  business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
);

CREATE POLICY "Users can insert reservations" ON reservations FOR INSERT WITH CHECK (
  business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update reservations" ON reservations FOR UPDATE USING (
  business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
);

CREATE POLICY "Users can delete reservations" ON reservations FOR DELETE USING (
  business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
);
