import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  Key,
  CheckCircle2,
  Lock,
  Mail,
  Phone,
  Search,
  Coffee,
  AlertCircle
} from 'lucide-react';
import { api } from '../../../services/api';
import { Button } from '../../common/Button';
import { Badge } from '../../common/Badge';
import { Modal } from '../../common/Modal';
import { ConfirmDialog } from '../../common/ConfirmDialog';
import { ToggleSwitch } from '../../common/ToggleSwitch';
import { useToast } from '../../../context/ToastContext';
import { useLanguage } from '../../../context/LanguageContext';

export const UsersAndAdminsView = () => {
  const toast = useToast();
  const { isRtl, t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Branch Manager',
    status: 'Active',
    password: '',
    permissions: ['Orders', 'Menu Stock']
  });

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminUsers();
      setUsers(data);
    } catch (e) {
      toast.error(isRtl ? 'فشل تحميل قائمة الموظفين والمسؤولين' : 'Failed to load admin users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      phone: '+20 100 ',
      role: 'Branch Manager',
      status: 'Active',
      password: '',
      permissions: ['Orders', 'Menu Stock', 'Facilities']
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      status: user.status,
      password: '',
      permissions: user.permissions || []
    });
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.warning(isRtl ? 'الاسم والبريد الإلكتروني مطلوبان' : 'Name and email are required');
      return;
    }

    try {
      setSubmitting(true);
      if (editingUser) {
        await api.updateAdminUser(editingUser.id, formData);
        toast.success(isRtl ? `تم تحديث بيانات المسؤول "${formData.name}"` : `Admin user "${formData.name}" updated`);
      } else {
        await api.createAdminUser(formData);
        toast.success(isRtl ? `تمت إضافة المسؤول الجديد "${formData.name}" بنجاح` : `New admin "${formData.name}" invited successfully`);
      }
      setIsModalOpen(false);
      loadUsers();
    } catch (err) {
      toast.error(isRtl ? 'فشل حفظ بيانات الموظف' : 'Failed to save staff user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickToggleStatus = async (user) => {
    if (user.role === 'Super Admin') {
      toast.warning(isRtl ? 'لا يمكن تعطيل حساب المسؤول العام' : 'Cannot disable Super Admin account');
      return;
    }
    const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    try {
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u)));
      await api.updateAdminUser(user.id, { ...user, status: newStatus });
      toast.success(isRtl ? `تم تحديث حالة حساب "${user.name}" إلى ${newStatus === 'Active' ? 'نشط' : 'معطل'}` : `Account status updated to ${newStatus}`);
    } catch (err) {
      toast.error(isRtl ? 'فشل تحديث حالة الحساب' : 'Failed to update account status');
      loadUsers();
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;
    try {
      setSubmitting(true);
      await api.deleteAdminUser(deletingUser.id);
      toast.success(isRtl ? `تم حذف المسؤول "${deletingUser.name}" من قائمة الفريق` : `User "${deletingUser.name}" removed from staff list`);
      setDeletingUser(null);
      loadUsers();
    } catch (err) {
      toast.error(isRtl ? 'فشل حذف المسؤول' : 'Failed to remove admin user');
    } finally {
      setSubmitting(false);
    }
  };

  const permissionsList = [
    { key: "Full Access", label: isRtl ? "صلاحيات كاملة للنظام" : "Full Access" },
    { key: "Financials & Revenue", label: isRtl ? "التقارير المالية والأرباح" : "Financials & Revenue" },
    { key: "Menu Management", label: isRtl ? "إدارة وتعديل المنيو" : "Menu Management" },
    { key: "Order Fulfillment", label: isRtl ? "استقبال ومتابعة الطلبات" : "Order Fulfillment" },
    { key: "Room Bookings", label: isRtl ? "حجوزات غرف الاجتماعات" : "Room Bookings" },
    { key: "Customer Reviews", label: isRtl ? "تقييمات وآراء العملاء" : "Customer Reviews" },
    { key: "Coupons & Loyalty", label: isRtl ? "الكوبونات ونقاط الولاء" : "Coupons & Loyalty" },
    { key: "Staff Access Roles", label: isRtl ? "إدارة حسابات الفريق" : "Staff Access Roles" }
  ];

  const togglePermission = (permKey) => {
    setFormData((prev) => {
      const exists = prev.permissions.includes(permKey);
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter((p) => p !== permKey)
          : [...prev.permissions, permKey]
      };
    });
  };

  const getRoleLabel = (role) => {
    if (!isRtl) return role;
    switch (role) {
      case 'Super Admin':
        return 'المدير العام (صلاحيات كاملة)';
      case 'Branch Manager':
        return 'مدير الفرع';
      case 'Head Barista & Kitchen Lead':
        return 'رئيس الباريستا والمطبخ';
      case 'Cashier & Front Desk':
        return 'الكاشير والاستقبال';
      default:
        return role;
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase());
    return matchRole && matchSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in w-full">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm w-full">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-chocolate-900 font-sans tracking-tight">
              {t('usersTitle', 'إدارة فريق العمل والصلاحيات')}
            </h2>
            <Badge variant="gold">{users.length} {isRtl ? 'حسابات مصرحة' : 'Authorized Accounts'}</Badge>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            {t('usersDesc', 'إدارة حسابات المدراء، تسجيلات دخول الباريستا وشاشات المطبخ، وصلاحيات كل دور.')}
          </p>
        </div>

        <Button
          variant="gold"
          size="md"
          icon={Plus}
          onClick={handleOpenAdd}
        >
          {isRtl ? 'إضافة موظف / مسؤول جديد' : 'Add New Staff User'}
        </Button>
      </div>

      {/* Search & Role Filters */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 w-full">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isRtl ? "بحث بالاسم، البريد، الدور..." : "Search staff name, email, role..."}
            className={`w-full ${isRtl ? 'pr-9 pl-4' : 'pl-9 pr-4'} py-2 text-xs sm:text-sm bg-stone-50 rounded-xl border border-stone-200 focus:border-gold-500 focus:bg-white outline-none transition-all`}
          />
          <Search className={`w-4 h-4 text-stone-400 absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2`} />
        </div>

        {/* Role Filter */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-stone-50 border border-stone-200 text-chocolate-900 focus:border-gold-500 outline-none cursor-pointer"
          >
            <option value="all">{isRtl ? 'جميع الأدوار والصلاحيات' : 'All Roles'}</option>
            <option value="Super Admin">{isRtl ? 'المدير العام' : 'Super Admin'}</option>
            <option value="Branch Manager">{isRtl ? 'مدير الفرع' : 'Branch Manager'}</option>
            <option value="Head Barista & Kitchen Lead">{isRtl ? 'رئيس الباريستا / المطبخ' : 'Head Barista / Kitchen'}</option>
            <option value="Cashier & Front Desk">{isRtl ? 'الكاشير / الاستقبال' : 'Cashier / Front Desk'}</option>
          </select>
        </div>
      </div>

      {/* Staff Table */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 border border-stone-200 text-center animate-pulse">
          <div className="h-48 bg-stone-100 rounded-2xl w-full" />
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-card overflow-hidden w-full">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-cream-50 text-chocolate-800 font-bold uppercase tracking-wider text-[10px] border-b border-stone-200">
                <tr>
                  <th className="py-4 px-4">{isRtl ? 'الموظف / المسؤول' : 'Staff Member'}</th>
                  <th className="py-4 px-4">{isRtl ? 'الدور والصلاحية' : 'Role & Privilege'}</th>
                  <th className="py-4 px-4">{isRtl ? 'رقم الهاتف' : 'Contact Phone'}</th>
                  <th className="py-4 px-4">{isRtl ? 'آخر تسجيل دخول' : 'Last Login'}</th>
                  <th className="py-4 px-4">{isRtl ? 'الحالة' : 'Status'}</th>
                  <th className="py-4 px-4 text-end">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-cream-50/60 transition-colors">
                    {/* User Profile */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3.5">
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover border border-gold-400 shadow-sm shrink-0"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80";
                          }}
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-chocolate-900 text-xs sm:text-sm">
                            {user.name}
                          </p>
                          <p className="text-[11px] text-stone-400 font-mono">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 font-bold px-2.5 py-1 rounded-lg text-[11px] ${
                          user.role === 'Super Admin'
                            ? 'bg-chocolate-900 text-gold-300'
                            : user.role === 'Branch Manager'
                            ? 'bg-gold-100 text-gold-900'
                            : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {getRoleLabel(user.role)}
                      </span>
                    </td>

                    {/* Phone */}
                    <td className="py-3.5 px-4 text-stone-600 font-mono">
                      {user.phone || 'N/A'}
                    </td>

                    {/* Last Login */}
                    <td className="py-3.5 px-4 text-stone-500 font-medium">
                      {user.lastLogin || (isRtl ? 'لم يسجل بعد' : 'Never')}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <ToggleSwitch
                          size="sm"
                          checked={user.status === 'Active'}
                          disabled={user.role === 'Super Admin'}
                          onChange={() => handleQuickToggleStatus(user)}
                          ariaLabel={isRtl ? 'حالة الحساب' : 'User Account Status'}
                        />
                        <span className={`text-[11px] font-bold ${user.status === 'Active' ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {user.status === 'Active' ? (isRtl ? 'نشط' : 'Active') : (isRtl ? 'معطل' : 'Inactive')}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-end">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Edit2}
                          onClick={() => handleOpenEdit(user)}
                        >
                          {isRtl ? 'تعديل' : 'Edit'}
                        </Button>
                        {user.role !== 'Super Admin' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Trash2}
                            className="text-rose-600 hover:bg-rose-50"
                            onClick={() => setDeletingUser(user)}
                          >
                            {isRtl ? 'حذف' : 'Delete'}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Admin Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? (isRtl ? "تعديل حساب الموظف" : "Edit Staff Account") : (isRtl ? "إضافة موظف / مسؤول جديد" : "Add Staff / Admin User")}
        subtitle={isRtl ? "إدارة بيانات تسجيل الدخول وتعيين الأدوار والصلاحيات" : "Manage authentication credentials and role assignments"}
        maxWidth="max-w-2xl"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              variant="gold"
              size="sm"
              onClick={handleSaveUser}
              loading={submitting}
            >
              {editingUser ? (isRtl ? "حفظ التعديلات" : "Save User Changes") : (isRtl ? "إنشاء الحساب" : "Create Account")}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveUser} className="space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-chocolate-900 mb-1">
                {isRtl ? 'الاسم بالكامل *' : 'Full Name *'}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={isRtl ? "مثال: عمر السيد" : "e.g. Omar El-Sayed"}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:border-gold-500 outline-none text-chocolate-900 font-semibold"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-chocolate-900 mb-1">
                {isRtl ? 'البريد الإلكتروني *' : 'Email Address *'}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="omar@cafe90egypt.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:border-gold-500 outline-none text-chocolate-900"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-chocolate-900 mb-1">
                {isRtl ? 'رقم الهاتف' : 'Contact Phone'}
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+20 100 123 4567"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:border-gold-500 outline-none text-chocolate-900 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-chocolate-900 mb-1">
                {isRtl ? 'الدور الوظيفي *' : 'Role *'}
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:border-gold-500 outline-none bg-white text-chocolate-900 font-semibold cursor-pointer"
              >
                <option value="Super Admin">{isRtl ? 'المدير العام (صلاحيات كاملة)' : 'Super Admin (Full Rights)'}</option>
                <option value="Branch Manager">{isRtl ? 'مدير الفرع' : 'Branch Manager'}</option>
                <option value="Head Barista & Kitchen Lead">{isRtl ? 'رئيس الباريستا وقائد المطبخ' : 'Head Barista & Kitchen Lead'}</option>
                <option value="Cashier & Front Desk">{isRtl ? 'الكاشير ومسؤول الاستقبال' : 'Cashier & Front Desk'}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-chocolate-900 mb-1">
              {isRtl ? 'كلمة المرور' : 'Account Password'} {editingUser && (isRtl ? "(اتركها فارغة للإبقاء على الحالية)" : "(Leave blank to keep current)")}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={editingUser ? "••••••••" : (isRtl ? "أدخل كلمة مرور قوية" : "Create secure password")}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:border-gold-500 outline-none text-chocolate-900"
            />
          </div>

          {/* Permissions Matrix */}
          <div>
            <label className="block font-bold text-chocolate-900 mb-2">
              {isRtl ? 'صلاحيات الوصول للأقسام' : 'Module Access Privileges'}
            </label>
            <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-cream-50/70 border border-stone-200">
              {permissionsList.map((perm) => (
                <label
                  key={perm.key}
                  className="flex items-center gap-2 text-xs font-medium text-chocolate-800 cursor-pointer p-1"
                >
                  <input
                    type="checkbox"
                    checked={
                      formData.role === 'Super Admin' || formData.permissions.includes(perm.key)
                    }
                    disabled={formData.role === 'Super Admin'}
                    onChange={() => togglePermission(perm.key)}
                    className="w-4 h-4 text-gold-600 rounded border-stone-300 focus:ring-gold-500 cursor-pointer"
                  />
                  <span>{perm.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 border border-stone-200">
            <div>
              <p className="font-bold text-xs sm:text-sm text-chocolate-900">
                {isRtl ? 'حالة نشاط الحساب' : 'Account Active Status'}
              </p>
              <p className="text-[11px] text-stone-500 mt-0.5">
                {isRtl ? 'السماح للعضو بتسجيل الدخول للداشبورد والكاشير' : 'Allow user to log into dashboard & registers'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold ${formData.status === 'Active' ? 'text-emerald-700' : 'text-rose-700'}`}>
                {formData.status === 'Active' ? (isRtl ? 'مفعّل' : 'Active') : (isRtl ? 'معطل' : 'Inactive')}
              </span>
              <ToggleSwitch
                checked={formData.status === 'Active'}
                onChange={(checked) =>
                  setFormData({ ...formData, status: checked ? 'Active' : 'Inactive' })
                }
                ariaLabel={isRtl ? 'تفعيل الحساب' : 'Toggle User Active Status'}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingUser)}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleDeleteConfirm}
        title={isRtl ? "حذف حساب الموظف؟" : "Remove Staff User?"}
        message={isRtl
          ? `هل أنت متأكد من رغبتك في تعطيل وحذف "${deletingUser?.name}"؟ سيفقد صلاحيات الدخول فوراً.`
          : `Are you sure you want to deactivate and remove "${deletingUser?.name}"? They will immediately lose administrative access.`
        }
        loading={submitting}
      />
    </div>
  );
};
