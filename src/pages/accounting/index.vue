<template>
  <view class="container">
    <view class="header">
      <view class="title-wrapper">
        <text class="title">记账功能</text>
      </view>
    </view>
    
    <!-- 月份选择器 -->
    <view class="month-selector">
      <picker mode="date" fields="month" bindchange="onMonthChange" value="{{ currentDate }}">
        <view class="picker">
          <nut-icon name="calendar" size="16" color="#667eea" />
          <text class="picker-text">{{ currentYearMonth }}</text>
          <nut-icon name="arrow-down" size="14" color="#999" />
        </view>
      </picker>
    </view>
    
    <!-- 收支概览 -->
    <view class="overview-card">
      <view class="overview-header">
        <text class="overview-title">收支概览</text>
      </view>
      <view class="overview-content">
        <view class="overview-item">
          <view class="item-icon income-icon">
            <nut-icon name="add" size="20" color="#52c41a" />
          </view>
          <text class="label">本月收入</text>
          <text class="amount income">+¥{{ monthlyIncome.toFixed(2) }}</text>
        </view>
        <view class="overview-divider"></view>
        <view class="overview-item">
          <view class="item-icon expense-icon">
            <nut-icon name="subtract" size="20" color="#f5222d" />
          </view>
          <text class="label">本月支出</text>
          <text class="amount expense">-¥{{ monthlyExpense.toFixed(2) }}</text>
        </view>
        <view class="overview-divider"></view>
        <view class="overview-item">
          <view class="item-icon balance-icon" :class="{ positive: monthlyBalance >= 0, negative: monthlyBalance < 0 }">
            <nut-icon 
              :name="monthlyBalance >= 0 ? 'trend-up' : 'trend-down'" 
              size="20" 
              :color="monthlyBalance >= 0 ? '#52c41a' : '#f5222d'" 
            />
          </view>
          <text class="label">本月结余</text>
          <text class="amount balance" :class="{ positive: monthlyBalance >= 0, negative: monthlyBalance < 0 }">
            {{ monthlyBalance >= 0 ? '+' : '' }}¥{{ Math.abs(monthlyBalance).toFixed(2) }}
          </text>
        </view>
      </view>
    </view>
    
    <!-- 记账表单 -->
    <view class="record-form">
      <view class="form-header">
        <text class="form-title">添加记账记录</text>
      </view>
      
      <!-- 收支类型选择 -->
      <view class="type-selector">
        <view 
          :class="['type-item', { active: recordType === 'income' }]"
          @tap="recordType = 'income'"
        >
          <view class="type-icon income-bg">
            <nut-icon name="add" size="20" color="#fff" />
          </view>
          <text class="type-text">收入</text>
        </view>
        <view 
          :class="['type-item', { active: recordType === 'expense' }]"
          @tap="recordType = 'expense'"
        >
          <view class="type-icon expense-bg">
            <nut-icon name="subtract" size="20" color="#fff" />
          </view>
          <text class="type-text">支出</text>
        </view>
      </view>
      
      <!-- 金额输入 -->
      <view class="form-field">
        <text class="field-label">金额</text>
        <view class="amount-input-container">
          <text class="currency-symbol">¥</text>
          <input 
            v-model.number="recordAmount" 
            type="digit" 
            placeholder="0.00" 
            class="amount-input"
            :class="{ focus: amountInputFocus }"
            @focus="amountInputFocus = true"
            @blur="amountInputFocus = false"
          />
        </view>
      </view>
      
      <!-- 类别选择 -->
      <view class="form-field">
        <text class="field-label">类别</text>
        <picker 
          mode="selector" 
          :range="currentCategoryOptions" 
          :value="categoryIndex"
          @change="handleCategoryChange"
        >
          <view class="category-picker">
            <nut-icon name="category" size="16" color="#999" />
            <text class="picker-text">{{ currentCategoryOptions[categoryIndex] || '请选择类别' }}</text>
            <nut-icon name="arrow-down" size="14" color="#999" />
          </view>
        </picker>
      </view>
      
      <!-- 备注输入 -->
      <view class="form-field">
        <text class="field-label">备注</text>
        <input 
          v-model="recordRemark" 
          placeholder="添加备注信息（可选）" 
          class="remark-input"
        />
      </view>
      
      <!-- 添加按钮 -->
      <button @tap="addRecord" class="add-btn" :disabled="!canAddRecord">
        <nut-icon name="add-circle" size="18" color="#fff" />
        <text class="btn-text">添加记录</text>
      </button>
    </view>
    
    <!-- 记账记录列表 -->
    <view class="records-section">
      <view class="section-header">
        <text class="section-title">本月记录</text>
        <text class="record-count">{{ filteredRecords.length }}条记录</text>
      </view>
      <view class="records-list">
        <view v-if="filteredRecords.length === 0" class="empty-state">
          <nut-icon name="list" size="48" color="#ddd" />
          <text class="empty-text">本月暂无记账记录</text>
        </view>
        <view 
          v-for="record in filteredRecords" 
          :key="record.id" 
          class="record-item"
          :class="record.type"
        >
          <view class="record-icon">
            <nut-icon 
              :name="record.type === 'income' ? 'add' : 'subtract'" 
              size="16" 
              :color="record.type === 'income' ? '#52c41a' : '#f5222d'" 
            />
          </view>
          <view class="record-info">
            <view class="record-header">
              <text class="record-category">{{ record.category }}</text>
              <text :class="['record-amount', record.type]">
                {{ record.type === 'income' ? '+' : '-' }}¥{{ record.amount.toFixed(2) }}
              </text>
            </view>
            <view class="record-meta">
              <text class="record-date">{{ formatRecordDate(record.date) }}</text>
              <text v-if="record.remark" class="record-remark">{{ record.remark }}</text>
            </view>
          </view>
          <view class="record-actions">
            <button @tap="editRecord(record)" class="action-btn edit-btn">
              <nut-icon name="edit" size="16" color="var(--primary-color)" />
            </button>
            <button @tap="deleteRecord(record.id)" class="action-btn delete-btn">
              <nut-icon name="delete" size="16" color="var(--danger-color)" />
            </button>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 编辑记录弹窗 -->
    <view v-if="editingRecord" class="modal-overlay" @tap="cancelEdit">
      <view class="modal" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">编辑记账记录</text>
          <button class="close-btn" @tap="cancelEdit">
            <nut-icon name="close" size="20" color="#999" />
          </button>
        </view>
        
        <view class="type-selector modal-selector">
          <view 
            :class="['type-item', { active: editingRecordType === 'income' }]"
            @tap="editingRecordType = 'income'"
          >
            <nut-icon name="add" size="20" color="#fff" />
        <text class="type-text">收入</text>
          </view>
          <view 
            :class="['type-item', { active: editingRecordType === 'expense' }]"
            @tap="editingRecordType = 'expense'"
          >
            <nut-icon name="subtract" size="20" color="#fff" />
        <text class="type-text">支出</text>
          </view>
        </view>
        
        <view class="modal-field">
          <text class="field-label">金额</text>
          <view class="amount-input-container">
            <text class="currency-symbol">¥</text>
            <input 
              v-model.number="editingRecordAmount" 
              type="digit" 
              class="amount-input"
            />
          </view>
        </view>
        
        <view class="modal-field">
          <text class="field-label">类别</text>
          <picker 
            mode="selector" 
            :range="getEditingCategoryOptions()" 
            :value="editingCategoryIndex"
            @change="handleEditingCategoryChange"
          >
            <view class="category-picker modal-picker">
              <nut-icon name="category" size="16" color="#999" />
              <text class="picker-text">{{ getEditingCategoryOptions()[editingCategoryIndex] || '请选择类别' }}</text>
              <nut-icon name="arrow-down" size="14" color="#999" />
            </view>
          </picker>
        </view>
        
        <view class="modal-field">
          <text class="field-label">备注</text>
          <input 
            v-model="editingRecordRemark" 
            class="remark-input"
          />
        </view>
        
        <view class="modal-actions">
          <button @tap="cancelEdit" class="cancel-btn">
            <text>取消</text>
          </button>
          <button @tap="saveEditedRecord" class="save-btn" :disabled="!canSaveEdit">
            <nut-icon name="check" size="18" color="#fff" />
            <text>保存</text>
          </button>
        </view>
      </view>
    </view>
    
    <!-- 自定义底部栏 -->
    <CustomTabBar />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAccountingStore } from '@/store/accounting';
import CustomTabBar from '../../components/CustomTabBar/index.vue';
import type { RecordType, AccountingRecord } from '@/store/accounting';
import Taro from '@tarojs/taro';
import './index.scss'

// 使用记账状态管理
const accountingStore = useAccountingStore();

// 响应式数据
const recordType = ref<RecordType>('expense');
const recordAmount = ref<number>(0);
const categoryIndex = ref(0);
const recordRemark = ref('');
const currentYearMonth = ref('');
const currentDate = ref('');
const editingRecord = ref<AccountingRecord | null>(null);
const editingRecordType = ref<RecordType>('expense');
const editingRecordAmount = ref<number>(0);
const editingCategoryIndex = ref(0);
const editingRecordRemark = ref('');
const amountInputFocus = ref(false);

// 预设的收入和支出类别
const incomeCategories = ['工资', '奖金', '投资收益', '副业收入', '其他收入'];
const expenseCategories = ['餐饮', '交通', '购物', '娱乐', '医疗', '教育', '住房', '其他支出'];

// 计算属性
const currentCategoryOptions = computed(() => {
  return recordType.value === 'income' ? incomeCategories : expenseCategories;
});

const filteredRecords = computed(() => {
  return accountingStore.getMonthlyRecords(currentYearMonth.value);
});

const monthlyIncome = computed(() => {
  return accountingStore.getMonthlyIncome(currentYearMonth.value);
});

const monthlyExpense = computed(() => {
  return accountingStore.getMonthlyExpense(currentYearMonth.value);
});

const monthlyBalance = computed(() => {
  return monthlyIncome.value - monthlyExpense.value;
});

const canAddRecord = computed(() => {
  return recordAmount.value > 0 && categoryIndex.value >= 0;
});

const canSaveEdit = computed(() => {
  return editingRecord !== null && editingRecordAmount.value > 0 && editingCategoryIndex.value >= 0;
});

// 方法
const getEditingCategoryOptions = () => {
  return editingRecordType.value === 'income' ? incomeCategories : expenseCategories;
};

// 处理类别选择变更
const handleCategoryChange = (event: any) => {
  categoryIndex.value = event.detail.value;
};

// 处理编辑模式下的类别选择变更
const handleEditingCategoryChange = (event: any) => {
  editingCategoryIndex.value = event.detail.value;
};

const formatRecordDate = (date: string) => {
  const d = new Date(date);
  return `${d.getDate()}日`;
};

const setCurrentMonth = (date?: Date) => {
  const now = date || new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  currentYearMonth.value = `${year}年${month}月`;
  currentDate.value = `${year}-${String(month).padStart(2, '0')}`;
};

const onMonthChange = (event: any) => {
  const value = event.detail.value;
  setCurrentMonth(new Date(value));
};

const addRecord = () => {
  if (!canAddRecord.value) return;
  
  const selectedCategory = currentCategoryOptions.value[categoryIndex.value];
  const newRecord: Omit<AccountingRecord, 'id'> = {
    type: recordType.value,
    amount: recordAmount.value,
    category: selectedCategory,
    remark: recordRemark.value,
    date: new Date().toISOString(),
    yearMonth: currentYearMonth.value
  };
  
  accountingStore.addRecord(newRecord);
  
  // 重置表单
  recordAmount.value = 0;
  categoryIndex.value = 0;
  recordRemark.value = '';
};

const editRecord = (record: AccountingRecord) => {
  editingRecord.value = { ...record };
  editingRecordType.value = record.type;
  editingRecordAmount.value = record.amount;
  
  // 设置类别索引
  const categories = record.type === 'income' ? incomeCategories : expenseCategories;
  editingCategoryIndex.value = categories.findIndex(c => c === record.category) || 0;
  
  editingRecordRemark.value = record.remark || '';
};

const saveEditedRecord = () => {
  if (!editingRecord.value || !canSaveEdit.value) return;
  
  const selectedCategory = getEditingCategoryOptions()[editingCategoryIndex.value];
  
  accountingStore.updateRecord(editingRecord.value.id, {
    type: editingRecordType.value,
    amount: editingRecordAmount.value,
    category: selectedCategory,
    remark: editingRecordRemark.value
  });
  
  cancelEdit();
};

const cancelEdit = () => {
  editingRecord.value = null;
};

const deleteRecord = (recordId: string) => {
  // 显示确认对话框
  Taro.showModal({
    title: '确认删除',
    content: '确定要删除这条记账记录吗？',
    success: (res) => {
      if (res.confirm) {
        accountingStore.deleteRecord(recordId);
      }
    }
  });
};

// 生命周期钩子
onMounted(() => {
  setCurrentMonth();
  accountingStore.loadRecords();
});
</script>
