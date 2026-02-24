'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useConvexAuth } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Shield, Eye, Mail, MessageSquare, UserPlus, Activity, Search, Loader2, CheckCircle } from 'lucide-react';

type ProfileVisibility = 'public' | 'connections' | 'private';
type AllowMessages = 'everyone' | 'connections' | 'nobody';

interface PrivacyState {
  profileVisibility: ProfileVisibility;
  showOnlineStatus: boolean;
  showEmail: boolean;
  allowMessages: AllowMessages;
  allowFollowRequests: boolean;
  showActivity: boolean;
  searchVisible: boolean;
}

export function PrivacySettings() {
  const { isAuthenticated } = useConvexAuth();
  const settings = useQuery(api.users.getPrivacySettings, isAuthenticated ? undefined : 'skip');
  const updatePrivacy = useMutation(api.users.updatePrivacySettings);

  const [local, setLocal] = useState<PrivacyState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (settings && !local) {
      setLocal({
        profileVisibility: settings.profileVisibility as ProfileVisibility,
        showOnlineStatus: settings.showOnlineStatus,
        showEmail: settings.showEmail,
        allowMessages: settings.allowMessages as AllowMessages,
        allowFollowRequests: settings.allowFollowRequests,
        showActivity: settings.showActivity,
        searchVisible: settings.searchVisible,
      });
    }
  }, [settings, local]);

  useEffect(() => {
    if (settings && local) {
      const isDirty =
        local.profileVisibility !== settings.profileVisibility ||
        local.showOnlineStatus !== settings.showOnlineStatus ||
        local.showEmail !== settings.showEmail ||
        local.allowMessages !== settings.allowMessages ||
        local.allowFollowRequests !== settings.allowFollowRequests ||
        local.showActivity !== settings.showActivity ||
        local.searchVisible !== settings.searchVisible;
      setDirty(isDirty);
    }
  }, [local, settings]);

  const handleSave = async () => {
    if (!local) return;
    setSaving(true);
    try {
      await updatePrivacy(local);
      setSaved(true);
      setDirty(false);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (settings) {
      setLocal({
        profileVisibility: settings.profileVisibility as ProfileVisibility,
        showOnlineStatus: settings.showOnlineStatus,
        showEmail: settings.showEmail,
        allowMessages: settings.allowMessages as AllowMessages,
        allowFollowRequests: settings.allowFollowRequests,
        showActivity: settings.showActivity,
        searchVisible: settings.searchVisible,
      });
    }
  };

  if (!settings || !local) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Shield className="w-6 h-6 text-blue-500" />
        <div>
          <h2 className="text-xl font-bold text-white">Privacy Settings</h2>
          <p className="text-sm text-zinc-400">Control who can see your information and interact with you</p>
        </div>
      </div>

      {/* Profile Visibility */}
      <SettingSection
        icon={<Eye className="w-5 h-5 text-purple-400" />}
        title="Profile Visibility"
        description="Choose who can see your profile information"
      >
        <select
          value={local.profileVisibility}
          onChange={(e) => setLocal({ ...local, profileVisibility: e.target.value as ProfileVisibility })}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="public">Public — Anyone can view your profile</option>
          <option value="connections">Connections Only — Only people you follow/follow you</option>
          <option value="private">Private — Only you can see your full profile</option>
        </select>
      </SettingSection>

      {/* Online Status */}
      <SettingSection
        icon={<Activity className="w-5 h-5 text-green-400" />}
        title="Online Status"
        description="Show others when you are online"
      >
        <ToggleSwitch
          checked={local.showOnlineStatus}
          onChange={(v) => setLocal({ ...local, showOnlineStatus: v })}
          label={local.showOnlineStatus ? 'Visible' : 'Hidden'}
        />
      </SettingSection>

      {/* Email Visibility */}
      <SettingSection
        icon={<Mail className="w-5 h-5 text-yellow-400" />}
        title="Email Visibility"
        description="Show your email address on your profile"
      >
        <ToggleSwitch
          checked={local.showEmail}
          onChange={(v) => setLocal({ ...local, showEmail: v })}
          label={local.showEmail ? 'Visible to others' : 'Hidden'}
        />
      </SettingSection>

      {/* Messages */}
      <SettingSection
        icon={<MessageSquare className="w-5 h-5 text-blue-400" />}
        title="Direct Messages"
        description="Control who can send you direct messages"
      >
        <select
          value={local.allowMessages}
          onChange={(e) => setLocal({ ...local, allowMessages: e.target.value as AllowMessages })}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="everyone">Everyone</option>
          <option value="connections">Connections only</option>
          <option value="nobody">Nobody</option>
        </select>
      </SettingSection>

      {/* Follow Requests */}
      <SettingSection
        icon={<UserPlus className="w-5 h-5 text-pink-400" />}
        title="Follow Requests"
        description="Allow anyone to follow you without approval"
      >
        <ToggleSwitch
          checked={local.allowFollowRequests}
          onChange={(v) => setLocal({ ...local, allowFollowRequests: v })}
          label={local.allowFollowRequests ? 'Open — anyone can follow' : 'Restricted — requires approval'}
        />
      </SettingSection>

      {/* Activity Feed */}
      <SettingSection
        icon={<Activity className="w-5 h-5 text-orange-400" />}
        title="Activity Feed"
        description="Show your activity (posts, comments, etc.) on your profile"
      >
        <ToggleSwitch
          checked={local.showActivity}
          onChange={(v) => setLocal({ ...local, showActivity: v })}
          label={local.showActivity ? 'Visible' : 'Hidden'}
        />
      </SettingSection>

      {/* Search Visibility */}
      <SettingSection
        icon={<Search className="w-5 h-5 text-cyan-400" />}
        title="Search Visibility"
        description="Allow others to find you through search"
      >
        <ToggleSwitch
          checked={local.searchVisible}
          onChange={(v) => setLocal({ ...local, searchVisible: v })}
          label={local.searchVisible ? 'Discoverable' : 'Hidden from search'}
        />
      </SettingSection>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-zinc-800">
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
          ) : saved ? (
            <><CheckCircle className="w-4 h-4" /> Saved!</>
          ) : (
            'Save Changes'
          )}
        </button>
        {dirty && (
          <button
            onClick={handleReset}
            className="px-5 py-2 text-zinc-400 hover:text-white transition-colors"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}

function SettingSection({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 flex items-start gap-3">
          <div className="mt-0.5">{icon}</div>
          <div>
            <h3 className="font-medium text-white">{title}</h3>
            <p className="text-sm text-zinc-400">{description}</p>
          </div>
        </div>
        <div className="sm:w-64">{children}</div>
      </div>
    </div>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-zinc-700'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      <span className="text-sm text-zinc-300">{label}</span>
    </div>
  );
}