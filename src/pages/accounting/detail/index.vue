<template>
  <nut-navbar 
    :title="isViewMode ? '记录详情' : '添加记录'" 
    left-show 
    @click-back="goBack" 
    fixed 
    placeholder 
    safe-area-inset-top 
    z-index="999"
    class="custom-navbar"
    :style="{ '--status-bar-height': statusBarHeight + 'px' }"
  ></nut-navbar>
  <view class="container">
    <!-- 添加记录表单 -->
    <view class="section">
        <nut-form ref="formRef" :model-value="formData">
            <nut-form-item label="收支类型" prop="recordType">
                <nut-radio-group v-model="formData.recordType" direction="horizontal">
                    <nut-radio label="income">收入</nut-radio>
                    <nut-radio label="expense">支出</nut-radio>
                </nut-radio-group>
            </nut-form-item>
            <!-- 金额输入 -->
            <nut-form-item label="金额" prop="amount">
                <nut-input
                    v-model="formData.amount"
                    placeholder="请输入金额"
                    type="digit"
                />
            </nut-form-item>
            <!-- 类别选择 -->
            <nut-form-item label="类别" prop="category">
                <view class="category-picker" @click="showPop = true">
                    <text 
                        :class="{'picker-text': true, 'active': currentCategoryOptions.find(item => item.value === formData.category)}"
                    >{{ currentCategoryOptions.find(item => item.value === formData.category)?.text || '请选择类别' }}</text>
                </view>
                <nut-popup v-model:visible="showPop" position="bottom">
                    <nut-picker v-model:value="formData.category" :columns="currentCategoryOptions" title="请选择类别" @confirm="handleCategoryChange" @cancel="showPop = false" />
                </nut-popup>
            </nut-form-item>
            <!-- 备注输入 -->
            <nut-form-item label="备注" prop="remark">
                <nut-input
                    v-model="formData.remark"
                    placeholder="添加备注信息（可选）"
                    type="text"
                />
            </nut-form-item>
        </nut-form>
    </view>
    <view class="record-form section">
      <!-- 操作按钮 -->
      <view v-if="!isViewMode" class="form-actions">
        <button @tap="goBack" class="cancel-btn">
          <text>取消</text>
        </button>
        <button @tap="saveRecord" class="save-btn" :disabled="!canSaveRecord">
          <text>{{ isEditMode ? '保存修改' : '添加记录' }}</text>
        </button>
      </view>

      <view v-else class="detail-actions">
        <button @tap="switchToEditMode" class="edit-btn">
          <text>编辑</text>
        </button>
        <button @tap="confirmDelete" class="delete-btn">
          <text>删除</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAccountingStore } from '@/store/accounting';
import type { RecordType, AccountingRecord } from '@/store/accounting';
import Taro, { useLoad, useRouter } from '@tarojs/taro';
import { useNavigationBar } from '@/utils/navigation';
import { DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES } from '@/constants/common';
import './index.scss';



const { statusBarHeight } = useNavigationBar();
const accountingStore = useAccountingStore();
const router = useRouter();

// 路由参数
const recordId = computed(() => router.params?.id as string);

const formData = ref({
  recordType: 'expense',
  amount: 0,
  category: '',
  remark: ''
})
const showPop = ref(false)

// 响应式数据
const isEditMode = ref(false);
const recordType = ref<RecordType>('expense');
const recordAmount = ref<number>(0);
const categoryIndex = ref(0);
const recordRemark = ref('');
const record = ref<AccountingRecord>({} as AccountingRecord);

// 预设的收入和支出类别
const incomeCategories = DEFAULT_INCOME_CATEGORIES.map(item => ({text: item.label, value: item.value}));
const expenseCategories = DEFAULT_EXPENSE_CATEGORIES.map(item => ({text: item.label, value: item.value}));

// 计算属性
const currentCategoryOptions = computed(() => {
  return recordType.value === 'income' ? incomeCategories : expenseCategories;
});

const isViewMode = computed(() => {
  return !!recordId.value && !isEditMode.value;
});

const canSaveRecord = computed(() => {
  return recordAmount.value > 0 && categoryIndex.value >= 0;
});

// 方法
const goBack = () => {
  Taro.navigateBack();
};

const handleCategoryChange = (event: any) => {
  formData.value.category = event.selectedValue[0];
  showPop.value = false;
};

const saveRecord = () => {
  if (!canSaveRecord.value) return;
  
  const selectedCategory = currentCategoryOptions.value[categoryIndex.value];
  
  if (isEditMode.value && record.value) {
    // 更新记录
    accountingStore.updateRecord(record.value.id, {
      type: recordType.value,
      amount: recordAmount.value,
      category: selectedCategory.value,
      remark: recordRemark.value
    });
    Taro.showToast({
      title: '修改成功',
      icon: 'success'
    });
  } else {
    // 添加新记录
    const newRecord = {
      type: recordType.value,
      amount: recordAmount.value,
      category: selectedCategory.value,
      remark: recordRemark.value,
      date: new Date().toISOString(),
      yearMonth: `${new Date().getFullYear()}年${new Date().getMonth() + 1}月`
    };
    
    accountingStore.addRecord(newRecord);
    Taro.showToast({
      title: '添加成功',
      icon: 'success'
    });
  }
  
  // 返回上一页
  setTimeout(() => {
    goBack();
  }, 1500);
};

const loadRecord = () => {
  if (recordId.value) {
    const allRecords = accountingStore.records;
    const foundRecord = allRecords.find(r => r.id === recordId.value);
    if (foundRecord) {
      record.value = foundRecord;
    } else {
      Taro.showToast({
        title: '记录不存在',
        icon: 'none'
      });
      goBack();
    }
  }
};

const switchToEditMode = () => {
  if (record.value) {
    isEditMode.value = true;
    recordType.value = record.value.type;
    recordAmount.value = record.value.amount;
    
    // 设置类别索引
    const categories = record.value.type === 'income' ? incomeCategories : expenseCategories;
    categoryIndex.value = categories.findIndex(c => c.value === record.value?.category) || 0;
    
    recordRemark.value = record.value.remark || '';
  }
};

const confirmDelete = () => {
  Taro.showModal({
    title: '确认删除',
    content: '确定要删除这条记账记录吗？',
    success: (res) => {
      if (res.confirm && record.value) {
        accountingStore.deleteRecord(record.value.id);
        Taro.showToast({
          title: '删除成功',
          icon: 'success'
        });
        setTimeout(() => {
          goBack();
        }, 1500);
      }
    }
  });
};

// 生命周期钩子
useLoad(() => {
  loadRecord();
});
</script>