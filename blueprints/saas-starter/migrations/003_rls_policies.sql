-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user ID from JWT
CREATE OR REPLACE FUNCTION auth.user_id() RETURNS UUID AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'sub')::UUID,
    NULL
  )
$$ LANGUAGE SQL STABLE;

-- Helper function to check organization membership
CREATE OR REPLACE FUNCTION auth.is_org_member(org_id UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id
    AND user_id = auth.user_id()
  )
$$ LANGUAGE SQL STABLE;

-- Helper function to check organization ownership/admin
CREATE OR REPLACE FUNCTION auth.is_org_admin(org_id UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id
    AND user_id = auth.user_id()
    AND role IN ('owner', 'admin')
  )
$$ LANGUAGE SQL STABLE;

-- Users policies
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (id = auth.user_id());

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (id = auth.user_id());

-- Organizations policies
CREATE POLICY "Members can view their organizations" ON public.organizations
  FOR SELECT USING (auth.is_org_member(id));

CREATE POLICY "Owners can update their organizations" ON public.organizations
  FOR UPDATE USING (owner_id = auth.user_id());

CREATE POLICY "Users can create organizations" ON public.organizations
  FOR INSERT WITH CHECK (owner_id = auth.user_id());

-- Organization members policies
CREATE POLICY "Members can view organization members" ON public.organization_members
  FOR SELECT USING (auth.is_org_member(organization_id));

CREATE POLICY "Admins can manage organization members" ON public.organization_members
  FOR ALL USING (auth.is_org_admin(organization_id));

-- Projects policies
CREATE POLICY "Members can view organization projects" ON public.projects
  FOR SELECT USING (auth.is_org_member(organization_id));

CREATE POLICY "Members can create projects" ON public.projects
  FOR INSERT WITH CHECK (auth.is_org_member(organization_id));

CREATE POLICY "Members can update projects" ON public.projects
  FOR UPDATE USING (auth.is_org_member(organization_id));

CREATE POLICY "Admins can delete projects" ON public.projects
  FOR DELETE USING (auth.is_org_admin(organization_id));

-- Activity logs policies (read-only for members)
CREATE POLICY "Members can view organization activity" ON public.activity_logs
  FOR SELECT USING (auth.is_org_member(organization_id));

-- Subscriptions policies
CREATE POLICY "Members can view organization subscription" ON public.subscriptions
  FOR SELECT USING (auth.is_org_member(organization_id));

CREATE POLICY "Admins can manage subscriptions" ON public.subscriptions
  FOR ALL USING (auth.is_org_admin(organization_id));

-- Invoices policies
CREATE POLICY "Members can view organization invoices" ON public.invoices
  FOR SELECT USING (auth.is_org_member(organization_id));

-- Payment methods policies
CREATE POLICY "Admins can view payment methods" ON public.payment_methods
  FOR SELECT USING (auth.is_org_admin(organization_id));

CREATE POLICY "Admins can manage payment methods" ON public.payment_methods
  FOR ALL USING (auth.is_org_admin(organization_id));