import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  FlatList,
  Modal,
  ProgressViewIOS,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  PiggyBank, 
  Plus, 
  Target, 
  Calendar, 
  Home,
  Car,
  GraduationCap,
  MapPin,
  Heart,
  Briefcase,
  ArrowLeft,
  Check,
  X,
  Edit3,
  Trash2,
  TrendingUp
} from 'lucide-react-native';
import CalendarPicker from '../../components/CalendarPicker';

// Main Savings Component
export default function SavingsScreen() {
  // Navigation state to track current screen
  const [currentScreen, setCurrentScreen] = useState('home'); // home, create, details
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSavings, setIsLoadingSavings] = useState(true);
  
  // Create Savings Goal Form States
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState('House Rent');
  const [description, setDescription] = useState('');
  
  // Form validation error states
  const [goalNameError, setGoalNameError] = useState('');
  const [targetAmountError, setTargetAmountError] = useState('');
  const [currentAmountError, setCurrentAmountError] = useState('');
  const [targetDateError, setTargetDateError] = useState('');
  
  // Savings data states
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [addAmountInput, setAddAmountInput] = useState('');
  
  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);

  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

  // Payment method state for deposits
  const [paymentMethod, setPaymentMethod] = useState(''); // 'mm' | 'bank'
  const [mmDetails, setMmDetails] = useState(null);
  const [banks, setBanks] = useState([]);
  const [selectedBankId, setSelectedBankId] = useState('');
  
  // Category options with icons
  const categoryOptions = [
    { name: 'House Rent', icon: Home },
    { name: 'Buy Car', icon: Car },
    { name: 'School Fees', icon: GraduationCap },
    { name: 'Buy Land', icon: MapPin },
    { name: 'Wedding', icon: Heart },
    { name: 'Business', icon: Briefcase },
    { name: 'Emergency Fund', icon: PiggyBank },
    { name: 'Vacation', icon: Target },
  ];
  
  // Load savings data when component mounts
  useEffect(() => {
    loadSavingsData();
  }, []);
  
  // Function to load savings data from AsyncStorage
  const loadSavingsData = async () => {
    setIsLoadingSavings(true);
    try {
      const [storedSavings, mmRaw, banksRaw] = await Promise.all([
        AsyncStorage.getItem('savingsGoals'),
        AsyncStorage.getItem('mobileMoney'),
        AsyncStorage.getItem('linkedBanks'),
      ]);
      if (storedSavings) {
        setSavingsGoals(JSON.parse(storedSavings));
      } else {
        const sampleGoals = [
          {
            id: '1',
            name: 'House Rent',
            targetAmount: 5000,
            currentAmount: 2500,
            targetDate: '2024-12-31',
            category: 'House Rent',
            description: 'Save for annual house rent payment',
            createdAt: '2024-08-01',
            lastUpdated: '2024-08-15'
          },
          {
            id: '2',
            name: 'New Car Fund',
            targetAmount: 25000,
            currentAmount: 8500,
            targetDate: '2025-06-30',
            category: 'Buy Car',
            description: 'Saving for a reliable family car',
            createdAt: '2024-07-15',
            lastUpdated: '2024-08-10'
          }
        ];
        await AsyncStorage.setItem('savingsGoals', JSON.stringify(sampleGoals));
        setSavingsGoals(sampleGoals);
      }
      if (mmRaw) {
        try { setMmDetails(JSON.parse(mmRaw)); } catch {}
      }
      if (banksRaw) {
        try { setBanks(JSON.parse(banksRaw)); } catch {}
      }
    } catch (error) {
      console.log('Error loading savings data:', error);
      Alert.alert('Error', 'Failed to load savings data');
    } finally {
      setIsLoadingSavings(false);
    }
  };
  
  // Function to validate create savings goal form
  const validateSavingsForm = () => {
    // Reset error messages
    setGoalNameError('');
    setTargetAmountError('');
    setCurrentAmountError('');
    setTargetDateError('');
    
    let isValid = true;
    
    // Validate goal name
    if (!goalName.trim()) {
      setGoalNameError('Goal name is required');
      isValid = false;
    }
    
    // Validate target amount
    if (!targetAmount) {
      setTargetAmountError('Target amount is required');
      isValid = false;
    } else if (parseFloat(targetAmount) <= 0) {
      setTargetAmountError('Target amount must be greater than 0');
      isValid = false;
    }
    
    // Validate current amount
    if (!currentAmount) {
      setCurrentAmountError('Current amount is required');
      isValid = false;
    } else if (parseFloat(currentAmount) < 0) {
      setCurrentAmountError('Current amount cannot be negative');
      isValid = false;
    } else if (parseFloat(currentAmount) > parseFloat(targetAmount)) {
      setCurrentAmountError('Current amount cannot exceed target amount');
      isValid = false;
    }
    
    // Validate target date
    if (!targetDate.trim()) {
      setTargetDateError('Target date is required');
      isValid = false;
    } else {
      // Basic date format validation (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(targetDate)) {
        setTargetDateError('Date format should be YYYY-MM-DD');
        isValid = false;
      } else {
        const selectedDate = new Date(targetDate);
        const today = new Date();
        if (selectedDate <= today) {
          setTargetDateError('Target date must be in the future');
          isValid = false;
        }
      }
    }
    
    return isValid;
  };
  
  // Function to handle savings goal creation
  const handleCreateSavingsGoal = async () => {
    if (!validateSavingsForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create new savings goal object
      const newGoal = {
        id: Date.now().toString(),
        name: goalName.trim(),
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount),
        targetDate: targetDate,
        category: category,
        description: description.trim(),
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
      
      // Add to savings goals
      const updatedGoals = [...savingsGoals, newGoal];
      await AsyncStorage.setItem('savingsGoals', JSON.stringify(updatedGoals));
      setSavingsGoals(updatedGoals);
      
      // Reset form
      setGoalName('');
      setTargetAmount('');
      setCurrentAmount('');
      setTargetDate('');
      setCategory('House Rent');
      setDescription('');
      
      setIsLoading(false);
      
      Alert.alert(
        'Savings Goal Created!',
        `Your savings goal "${newGoal.name}" has been created successfully.`,
        [{ text: 'OK', onPress: () => setCurrentScreen('home') }]
      );
    } catch (error) {
      setIsLoading(false);
      console.log('Error creating savings goal:', error);
      Alert.alert('Error', 'Failed to create savings goal. Please try again.');
    }
  };
  
  // Function to add money to a savings goal
  const handleAddMoney = async () => {
    if (!selectedGoal || !addAmountInput) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    const addAmount = parseFloat(addAmountInput);
    if (isNaN(addAmount) || addAmount <= 0) {
      Alert.alert('Error', 'Amount must be greater than 0');
      return;
    }
    if (!paymentMethod) {
      Alert.alert('Select Method', 'Please choose a payment method');
      return;
    }
    if (paymentMethod === 'mm' && !mmDetails?.provider) {
      Alert.alert('Setup Required', 'Add Mobile Money in Profile > Payment Method');
      return;
    }
    if (paymentMethod === 'bank' && !selectedBankId) {
      Alert.alert('Select Bank', 'Choose a linked bank');
      return;
    }

    const newCurrentAmount = selectedGoal.currentAmount + addAmount;
    if (newCurrentAmount > selectedGoal.targetAmount) {
      Alert.alert('Error', 'Adding this amount would exceed your target goal');
      return;
    }

    setIsLoading(true);

    try {
      const updatedGoals = savingsGoals.map(goal => {
        if (goal.id === selectedGoal.id) {
          return {
            ...goal,
            currentAmount: newCurrentAmount,
            lastUpdated: new Date().toISOString()
          };
        }
        return goal;
      });
      await AsyncStorage.setItem('savingsGoals', JSON.stringify(updatedGoals));
      setSavingsGoals(updatedGoals);

      // Record payment entry or queue offline
      try {
        const methodLabel = paymentMethod === 'mm' ? `Mobile Money - ${mmDetails?.provider || ''}` : (()=>{ const bank = banks.find(b=>b.id===selectedBankId); return bank ? `Bank - ${bank.bank}` : 'Bank'; })();
        const entry = { id: Date.now().toString(), amount: addAmount, note: `Savings Deposit - ${selectedGoal.name} (${methodLabel})`, date: new Date().toISOString(), goalId: selectedGoal.id, type: 'savings' };
        const offlineMode = (await AsyncStorage.getItem('offlineMode')) === 'true';
        if (offlineMode) {
          const outRaw = await AsyncStorage.getItem('offlineOutbox');
          const out = outRaw ? JSON.parse(outRaw) : [];
          await AsyncStorage.setItem('offlineOutbox', JSON.stringify([...out, { kind: 'payment', payload: entry }]));
        } else {
          const paymentsRaw = await AsyncStorage.getItem('payments');
          const list = paymentsRaw ? JSON.parse(paymentsRaw) : [];
          await AsyncStorage.setItem('payments', JSON.stringify([...list, entry]));
        }
      } catch (e) {
        console.log('Failed to record savings payment', e);
      }

      setSelectedGoal({
        ...selectedGoal,
        currentAmount: newCurrentAmount,
        lastUpdated: new Date().toISOString()
      });
      setAddAmountInput('');
      setPaymentMethod('');
      setSelectedBankId('');
      setShowAddMoneyModal(false);
      setIsLoading(false);

      if (newCurrentAmount >= selectedGoal.targetAmount) {
        Alert.alert(
          '🎉 Goal Completed!',
          `Congratulations! You've reached your savings goal for "${selectedGoal.name}"!`,
          [{ text: 'Awesome!' }]
        );
      } else {
        Alert.alert(
          'Money Added!',
          `Successfully added ${formatCurrency(addAmount)} to your "${selectedGoal.name}" goal.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      setIsLoading(false);
      console.log('Error adding money:', error);
      Alert.alert('Error', 'Failed to add money. Please try again.');
    }
  };
  
  // Function to delete a savings goal
  const handleDeleteGoal = async () => {
    if (!selectedGoal) return;
    
    setIsLoading(true);
    setShowDeleteConfirmModal(false);
    
    try {
      const updatedGoals = savingsGoals.filter(goal => goal.id !== selectedGoal.id);
      await AsyncStorage.setItem('savingsGoals', JSON.stringify(updatedGoals));
      setSavingsGoals(updatedGoals);
      
      setSelectedGoal(null);
      setCurrentScreen('home');
      setIsLoading(false);
      
      Alert.alert('Goal Deleted', 'Your savings goal has been deleted successfully.');
    } catch (error) {
      setIsLoading(false);
      console.log('Error deleting goal:', error);
      Alert.alert('Error', 'Failed to delete goal. Please try again.');
    }
  };
  
  // Function to format currency (Sierra Leone Leone - NLe)
  const formatCurrency = (amount) => {
    return `NLe ${new Intl.NumberFormat('en-SL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount)}`;
  };
  
  // Function to calculate progress percentage
  const calculateProgress = (current, target) => {
    return Math.min((current / target) * 100, 100);
  };
  
  // Function to calculate days remaining
  const calculateDaysRemaining = (targetDate) => {
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  
  // Function to get category icon
  const getCategoryIcon = (categoryName) => {
    const category = categoryOptions.find(cat => cat.name === categoryName);
    return category ? category.icon : PiggyBank;
  };
  
  // Function to render savings goal card
  const renderSavingsCard = ({ item: goal }) => {
    const progress = calculateProgress(goal.currentAmount, goal.targetAmount);
    const daysRemaining = calculateDaysRemaining(goal.targetDate);
    const isCompleted = goal.currentAmount >= goal.targetAmount;
    const CategoryIcon = getCategoryIcon(goal.category);
    
    return (
      <TouchableOpacity
        style={[styles.savingsCard, isCompleted && styles.completedCard]}
        onPress={() => {
          setSelectedGoal(goal);
          setCurrentScreen('details');
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <CategoryIcon color={isCompleted ? '#4CAF50' : '#FFA500'} size={24} />
            <Text style={[styles.goalName, isCompleted && styles.completedText]}>
              {goal.name}
            </Text>
          </View>
          {isCompleted && (
            <View style={styles.completedBadge}>
              <Check color="#4CAF50" size={16} />
              <Text style={styles.completedBadgeText}>Completed</Text>
            </View>
          )}
        </View>
        
        <View style={styles.progressSection}>
          <View style={styles.amountRow}>
            <Text style={styles.currentAmount}>
              {formatCurrency(goal.currentAmount)}
            </Text>
            <Text style={styles.targetAmount}>
              of {formatCurrency(goal.targetAmount)}
            </Text>
          </View>
          
          <View style={styles.progressBarContainer}>
            {Platform.OS === 'ios' ? (
              <ProgressViewIOS
                style={styles.progressBar}
                progress={progress / 100}
                progressTintColor={isCompleted ? '#4CAF50' : '#FFA500'}
                trackTintColor="#e0e0e0"
              />
            ) : (
              <View style={styles.progressBarBackground}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { 
                      width: `${progress}%`,
                      backgroundColor: isCompleted ? '#4CAF50' : '#FFA500'
                    }
                  ]} 
                />
              </View>
            )}
            <Text style={styles.progressText}>{progress.toFixed(1)}%</Text>
          </View>
        </View>
        
        <View style={styles.cardFooter}>
          <View style={styles.footerItem}>
            <Calendar color="#666" size={16} />
            <Text style={styles.footerText}>
              {daysRemaining > 0 ? `${daysRemaining} days left` : 'Overdue'}
            </Text>
          </View>
          <View style={styles.footerItem}>
            <Target color="#666" size={16} />
            <Text style={styles.footerText}>{goal.category}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  // Function to render category selection modal
  const renderCategoryModal = () => {
    return (
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <X color="#666" size={24} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.categoryList}>
              {categoryOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <TouchableOpacity
                    key={option.name}
                    style={[
                      styles.categoryOption,
                      category === option.name && styles.categoryOptionSelected
                    ]}
                    onPress={() => {
                      setCategory(option.name);
                      setShowCategoryModal(false);
                    }}
                  >
                    <View style={styles.categoryOptionLeft}>
                      <IconComponent 
                        color={category === option.name ? '#FFA500' : '#666'} 
                        size={20} 
                      />
                      <Text style={[
                        styles.categoryOptionText,
                        category === option.name && styles.categoryOptionTextSelected
                      ]}>
                        {option.name}
                      </Text>
                    </View>
                    {category === option.name && <Check color="#FFA500" size={20} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };
  
  // Function to render add money modal
  const maskAcct = (n) => (n && n.length > 4 ? `${'*'.repeat(Math.max(0, n.length - 4))}${n.slice(-4)}` : n);
  const maskPhone = (p) => (p ? `${p.slice(0, 4)}****${p.slice(-2)}` : '');

  const renderAddMoneyModal = () => {
    return (
      <Modal
        visible={showAddMoneyModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddMoneyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.addMoneyModalContent}>
            <Text style={styles.addMoneyTitle}>Add Money</Text>
            
            {selectedGoal && (
              <>
                <Text style={styles.addMoneySubtitle}>
                  Adding to: {selectedGoal.name}
                </Text>
                
                <View style={styles.currentProgressInfo}>
                  <Text style={styles.progressInfoText}>
                    Current: {formatCurrency(selectedGoal.currentAmount)}
                  </Text>
                  <Text style={styles.progressInfoText}>
                    Target: {formatCurrency(selectedGoal.targetAmount)}
                  </Text>
                  <Text style={styles.progressInfoText}>
                    Remaining: {formatCurrency(selectedGoal.targetAmount - selectedGoal.currentAmount)}
                  </Text>
                </View>

                <Text style={[styles.inputLabel, { marginBottom: 6 }]}>Payment Method</Text>
                {mmDetails ? (
                  <TouchableOpacity
                    style={[styles.selector, paymentMethod === 'mm' && { backgroundColor: '#fff5e6', borderColor: '#FFA500' }]}
                    onPress={() => { setPaymentMethod('mm'); setSelectedBankId(''); }}
                    testID="depositMethodMM"
                  >
                    <Text style={styles.selectorText}>Mobile Money - {mmDetails.provider} ({maskPhone(mmDetails.number)})</Text>
                    {paymentMethod === 'mm' ? <Text style={styles.selectorArrow}>✓</Text> : <Text style={styles.selectorArrow}>▼</Text>}
                  </TouchableOpacity>
                ) : (
                  <View style={{ marginBottom: 8 }}>
                    <Text style={{ color: '#999', marginBottom: 6 }}>No Mobile Money set</Text>
                    <TouchableOpacity style={styles.secondaryBtn} onPress={() => { setShowAddMoneyModal(false); router.push('/(tabs)/profile'); }}>
                      <Text style={styles.secondaryBtnText}>Set up in Profile</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <Text style={[styles.inputLabel, { marginTop: 8 }]}>Linked Banks</Text>
                {(!banks || banks.length === 0) ? (
                  <View style={{ marginBottom: 8 }}>
                    <Text style={{ color: '#999', marginBottom: 6 }}>No banks linked</Text>
                    <TouchableOpacity style={styles.secondaryBtn} onPress={() => { setShowAddMoneyModal(false); router.push('/(tabs)/profile'); }}>
                      <Text style={styles.secondaryBtnText}>Link a Bank</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  banks.map((b) => (
                    <TouchableOpacity
                      key={b.id}
                      style={[styles.selector, paymentMethod === 'bank' && selectedBankId === b.id && { backgroundColor: '#fff5e6', borderColor: '#FFA500' }]}
                      onPress={() => { setPaymentMethod('bank'); setSelectedBankId(b.id); }}
                      testID={`depositBank-${b.id}`}
                    >
                      <Text style={styles.selectorText}>{b.bank} • {maskAcct(b.number)}</Text>
                      {paymentMethod === 'bank' && selectedBankId === b.id ? <Text style={styles.selectorArrow}>✓</Text> : <Text style={styles.selectorArrow}>▼</Text>}
                    </TouchableOpacity>
                  ))
                )}
                
                <View style={[styles.addMoneyInputContainer, { marginTop: 10 }]}>
                  <Text style={styles.currencySymbol}>NLe</Text>
                  <TextInput
                    style={styles.addMoneyInput}
                    placeholder="0.00"
                    value={addAmountInput}
                    onChangeText={(text) => {
                      const numericText = text.replace(/[^0-9.]/g, '');
                      setAddAmountInput(numericText);
                    }}
                    keyboardType="numeric"
                    autoFocus={true}
                  />
                </View>
              </>
            )}
            
            <View style={styles.addMoneyActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowAddMoneyModal(false);
                  setAddAmountInput('');
                  setPaymentMethod('');
                  setSelectedBankId('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddMoney}
                disabled={isLoading || !addAmountInput}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.addButtonText}>Add Money</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };
  
  // Function to render delete confirmation modal
  const renderDeleteConfirmModal = () => {
    return (
      <Modal
        visible={showDeleteConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalContent}>
            <Text style={styles.confirmTitle}>Delete Savings Goal</Text>
            
            {selectedGoal && (
              <>
                <Text style={styles.confirmMessage}>
                  Are you sure you want to delete &quot;{selectedGoal.name}&quot;?
                </Text>
                
                <Text style={styles.confirmWarning}>
                  This action cannot be undone. You will lose all progress data for this goal.
                </Text>
              </>
            )}
            
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowDeleteConfirmModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDeleteGoal}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.deleteButtonText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };
  
  // Function to render home screen
  const renderHomeScreen = () => {
    const totalSaved = savingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);

    const completedGoals = savingsGoals.filter(goal => goal.currentAmount >= goal.targetAmount).length;
    
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>My Savings</Text>
            <Text style={styles.headerSubtitle}>Track your financial goals</Text>
          </View>
          
          {/* Summary Cards */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryCard}>
              <PiggyBank color="#FFA500" size={24} />
              <Text style={styles.summaryAmount}>{formatCurrency(totalSaved)}</Text>
              <Text style={styles.summaryLabel}>Total Saved</Text>
            </View>
            
            <View style={styles.summaryCard}>
              <Target color="#5CCEF4" size={24} />
              <Text style={styles.summaryAmount}>{savingsGoals.length}</Text>
              <Text style={styles.summaryLabel}>Active Goals</Text>
            </View>
            
            <View style={styles.summaryCard}>
              <TrendingUp color="#4CAF50" size={24} />
              <Text style={styles.summaryAmount}>{completedGoals}</Text>
              <Text style={styles.summaryLabel}>Completed</Text>
            </View>
          </View>
          
          {/* Create Goal Button */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={styles.createGoalButton}
              onPress={() => setCurrentScreen('create')}
            >
              <Plus color="#fff" size={20} />
              <Text style={styles.createGoalButtonText}>Create New Goal</Text>
            </TouchableOpacity>
          </View>
          
          {/* Savings Goals List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Savings Goals</Text>
            
            {isLoadingSavings ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#FFA500" size="large" />
                <Text style={styles.loadingText}>Loading your savings...</Text>
              </View>
            ) : savingsGoals.length === 0 ? (
              <View style={styles.emptyState}>
                <PiggyBank color="#ccc" size={48} />
                <Text style={styles.emptyStateText}>No savings goals yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Create your first savings goal to start building your future
                </Text>
              </View>
            ) : (
              <FlatList
                data={savingsGoals}
                renderItem={renderSavingsCard}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  };
  
  // Function to render create savings goal screen
  const renderCreateGoalScreen = () => {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView
            style={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header with back button */}
            <View style={styles.screenHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrentScreen('home')}
              >
                <ArrowLeft color="#FFA500" size={24} />
              </TouchableOpacity>
              <Text style={styles.screenTitle}>Create Savings Goal</Text>
            </View>
            
            {/* Form */}
            <View style={styles.formContainer}>
              {/* Goal Name Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Goal Name *</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g., House Rent, New Car, School Fees"
                    value={goalName}
                    onChangeText={setGoalName}
                    maxLength={50}
                  />
                </View>
                {goalNameError ? <Text style={styles.errorText}>{goalNameError}</Text> : null}
              </View>
              
              {/* Category Selector */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category *</Text>
                <TouchableOpacity
                  style={styles.selectorContainer}
                  onPress={() => setShowCategoryModal(true)}
                >
                  <View style={styles.categoryDisplay}>
                    {React.createElement(getCategoryIcon(category), { 
                      color: '#FFA500', 
                      size: 20 
                    })}
                    <Text style={styles.selectorText}>{category}</Text>
                  </View>
                  <Text style={styles.selectorArrow}>▼</Text>
                </TouchableOpacity>
              </View>
              
              {/* Target Amount Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Target Amount (NLe) *</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your savings target in NLe"
                    value={targetAmount}
                    onChangeText={(text) => {
                      // Allow numbers and decimal point
                      const numericText = text.replace(/[^0-9.]/g, '');
                      setTargetAmount(numericText);
                    }}
                    keyboardType="numeric"
                  />
                </View>
                {targetAmountError ? <Text style={styles.errorText}>{targetAmountError}</Text> : null}
              </View>
              
              {/* Current Amount Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Current Amount (NLe) *</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="How much have you saved already?"
                    value={currentAmount}
                    onChangeText={(text) => {
                      // Allow numbers and decimal point
                      const numericText = text.replace(/[^0-9.]/g, '');
                      setCurrentAmount(numericText);
                    }}
                    keyboardType="numeric"
                  />
                </View>
                {currentAmountError ? <Text style={styles.errorText}>{currentAmountError}</Text> : null}
              </View>
              
              {/* Target Date Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Target Date *</Text>
                <CalendarPicker
                  label="Select target date"
                  value={targetDate}
                  onChange={setTargetDate}
                  minDate={new Date().toISOString().slice(0,10)}
                  testIDPrefix="targetDate"
                />
                {targetDateError ? <Text style={styles.errorText}>{targetDateError}</Text> : null}
              </View>
              
              {/* Description Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description (Optional)</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    placeholder="Add a note about this savings goal..."
                    value={description}
                    onChangeText={setDescription}
                    multiline={true}
                    numberOfLines={3}
                    maxLength={200}
                  />
                </View>
              </View>
              
              {/* Create Button */}
              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreateSavingsGoal}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.createButtonText}>Create Savings Goal</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  };
  
  // Function to render goal details screen
  const renderGoalDetailsScreen = () => {
    if (!selectedGoal) return null;
    
    const progress = calculateProgress(selectedGoal.currentAmount, selectedGoal.targetAmount);
    const daysRemaining = calculateDaysRemaining(selectedGoal.targetDate);
    const isCompleted = selectedGoal.currentAmount >= selectedGoal.targetAmount;
    const CategoryIcon = getCategoryIcon(selectedGoal.category);
    const remainingAmount = selectedGoal.targetAmount - selectedGoal.currentAmount;
    
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollContainer}>
          {/* Header with back button */}
          <View style={styles.screenHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setCurrentScreen('home');
                setSelectedGoal(null);
              }}
            >
              <ArrowLeft color="#FFA500" size={24} />
            </TouchableOpacity>
            <Text style={styles.screenTitle}>Goal Details</Text>
            
            <TouchableOpacity
              style={styles.deleteIconButton}
              onPress={() => setShowDeleteConfirmModal(true)}
            >
              <Trash2 color="#e74c3c" size={20} />
            </TouchableOpacity>
          </View>
          
          {/* Goal Header */}
          <View style={[styles.goalDetailsHeader, isCompleted && styles.completedHeader]}>
            <View style={styles.goalTitleSection}>
              <CategoryIcon color={isCompleted ? '#4CAF50' : '#FFA500'} size={32} />
              <View style={styles.goalTitleText}>
                <Text style={[styles.goalDetailsName, isCompleted && styles.completedText]}>
                  {selectedGoal.name}
                </Text>
                <Text style={styles.goalCategory}>{selectedGoal.category}</Text>
              </View>
            </View>
            
            {isCompleted && (
              <View style={styles.completedBadgeLarge}>
                <Check color="#4CAF50" size={20} />
                <Text style={styles.completedBadgeTextLarge}>Completed!</Text>
              </View>
            )}
          </View>
          
          {/* Progress Section */}
          <View style={styles.progressDetailsSection}>
            <View style={styles.amountDetails}>
              <View style={styles.amountDetailItem}>
                <Text style={styles.amountDetailLabel}>Current Amount</Text>
                <Text style={styles.amountDetailValue}>
                  {formatCurrency(selectedGoal.currentAmount)}
                </Text>
              </View>
              
              <View style={styles.amountDetailItem}>
                <Text style={styles.amountDetailLabel}>Target Amount</Text>
                <Text style={styles.amountDetailValue}>
                  {formatCurrency(selectedGoal.targetAmount)}
                </Text>
              </View>
              
              {!isCompleted && (
                <View style={styles.amountDetailItem}>
                  <Text style={styles.amountDetailLabel}>Remaining</Text>
                  <Text style={[styles.amountDetailValue, styles.remainingAmount]}>
                    {formatCurrency(remainingAmount)}
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.progressBarSection}>
              {Platform.OS === 'ios' ? (
                <ProgressViewIOS
                  style={styles.progressBarLarge}
                  progress={progress / 100}
                  progressTintColor={isCompleted ? '#4CAF50' : '#FFA500'}
                  trackTintColor="#e0e0e0"
                />
              ) : (
                <View style={styles.progressBarBackgroundLarge}>
                  <View 
                    style={[
                      styles.progressBarFillLarge, 
                      { 
                        width: `${progress}%`,
                        backgroundColor: isCompleted ? '#4CAF50' : '#FFA500'
                      }
                    ]} 
                  />
                </View>
              )}
              <Text style={styles.progressTextLarge}>{progress.toFixed(1)}% Complete</Text>
            </View>
          </View>
          
          {/* Goal Info */}
          <View style={styles.goalInfoSection}>
            <View style={styles.infoRow}>
              <Calendar color="#666" size={20} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Target Date</Text>
                <Text style={styles.infoValue}>
                  {new Date(selectedGoal.targetDate).toLocaleDateString()}
                </Text>
                <Text style={[styles.infoSubtext, daysRemaining < 0 && styles.overdueText]}>
                  {daysRemaining > 0 ? `${daysRemaining} days remaining` : 
                   daysRemaining === 0 ? 'Due today' : `${Math.abs(daysRemaining)} days overdue`}
                </Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <Target color="#666" size={20} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Created</Text>
                <Text style={styles.infoValue}>
                  {new Date(selectedGoal.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
            
            {selectedGoal.description && (
              <View style={styles.infoRow}>
                <Edit3 color="#666" size={20} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Description</Text>
                  <Text style={styles.infoValue}>{selectedGoal.description}</Text>
                </View>
              </View>
            )}
          </View>
          
          {/* Action Button */}
          {!isCompleted && (
            <View style={styles.actionContainer}>
              <TouchableOpacity
                style={styles.addMoneyButton}
                onPress={() => setShowAddMoneyModal(true)}
              >
                <Plus color="#fff" size={20} />
                <Text style={styles.addMoneyButtonText}>Add Money</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  };
  
  // Reminders: alert 7am/2pm/7pm within 2 days before target date if not completed
  useEffect(() => {
    const timeSlots = [7,14,19];
    let t = setInterval(()=>{
      try {
        const now = new Date();
        if (!timeSlots.includes(now.getHours()) || now.getMinutes()>=5) return;
        const due = savingsGoals.filter(g => {
          const diff = new Date(g.targetDate).getTime() - Date.now();
          const within2 = diff <= 2*24*3600*1000 && diff >= 0;
          const notDone = g.currentAmount < g.targetAmount;
          return within2 && notDone;
        });
        if (due.length>0) {
          const names = due.map(g=>`• ${g.name}`).join('\n');
          Alert.alert('Savings Reminder', `Upcoming goals:\n${names}`);
        }
      } catch(e) { console.log('savings reminder', e); }
    }, 60*1000);
    setTimeout(()=>{},0);
    return ()=> clearInterval(t);
  }, [savingsGoals]);

  // Main render function
  return (
    <>
      {currentScreen === 'home' && renderHomeScreen()}
      {currentScreen === 'create' && renderCreateGoalScreen()}
      {currentScreen === 'details' && renderGoalDetailsScreen()}
      
      {/* Modals */}
      {renderCategoryModal()}
      {renderAddMoneyModal()}
      {renderDeleteConfirmModal()}
    </>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  
  // Header styles
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'Montserrat',
    color: '#00157f',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  
  // Screen header styles
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Montserrat',
    color: '#00157f',
    flex: 1,
  },
  deleteIconButton: {
    padding: 5,
  },
  
  // Summary cards styles
  summaryContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Montserrat',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  
  // Action container styles
  actionContainer: {
    padding: 20,
  },
  createGoalButton: {
    backgroundColor: '#FFA500',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createGoalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Montserrat',
    marginLeft: 8,
  },
  
  // Section styles
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Montserrat',
    color: '#00157f',
    marginBottom: 15,
  },
  
  // Savings card styles
  savingsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  completedCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  goalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  completedText: {
    color: '#4CAF50',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  completedBadgeText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  
  // Progress section styles
  progressSection: {
    marginBottom: 12,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  targetAmount: {
    fontSize: 14,
    color: '#666',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    minWidth: 45,
    textAlign: 'right',
  },
  
  // Card footer styles
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  
  // Form styles
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  textInput: {
    height: 50,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 80,
    paddingTop: 15,
    textAlignVertical: 'top',
  },
  selectorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    height: 50,
    paddingHorizontal: 15,
  },
  categoryDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectorText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  selectorArrow: {
    fontSize: 12,
    color: '#666',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  createButton: {
    backgroundColor: '#FFA500',
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '85%',
    maxWidth: 350,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  
  // Category list styles
  categoryList: {
    maxHeight: 300,
  },
  categoryOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryOptionSelected: {
    backgroundColor: '#fff5e6',
  },
  categoryOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryOptionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  categoryOptionTextSelected: {
    color: '#FFA500',
    fontWeight: 'bold',
  },
  
  // Add money modal styles
  addMoneyModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxWidth: 350,
  },
  addMoneyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  addMoneySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  currentProgressInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  progressInfoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  addMoneyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFA500',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 24,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFA500',
    paddingLeft: 15,
  },
  addMoneyInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 10,
    fontSize: 18,
    color: '#333',
  },
  addMoneyActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    flex: 1,
    backgroundColor: '#FFA500',
    borderRadius: 8,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Add money button styles
  addMoneyButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addMoneyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  
  // Confirmation modal styles
  confirmModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxWidth: 350,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  confirmMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  confirmWarning: {
    fontSize: 14,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Goal details styles
  goalDetailsHeader: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  completedHeader: {
    backgroundColor: '#f8fff8',
  },
  goalTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalTitleText: {
    marginLeft: 16,
    flex: 1,
  },
  goalDetailsName: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Montserrat',
    color: '#00157f',
    marginBottom: 4,
  },
  goalCategory: {
    fontSize: 16,
    color: '#666',
  },
  completedBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  completedBadgeTextLarge: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  
  // Progress details styles
  progressDetailsSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 10,
  },
  amountDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  amountDetailItem: {
    alignItems: 'center',
  },
  amountDetailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  amountDetailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  remainingAmount: {
    color: '#FFA500',
  },
  progressBarSection: {
    alignItems: 'center',
  },
  progressBarLarge: {
    width: '100%',
    height: 12,
    marginBottom: 8,
  },
  progressBarBackgroundLarge: {
    width: '100%',
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFillLarge: {
    height: '100%',
    borderRadius: 6,
  },
  progressTextLarge: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  
  // Goal info styles
  goalInfoSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  infoContent: {
    marginLeft: 16,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: 2,
  },
  infoSubtext: {
    fontSize: 12,
    color: '#999',
  },
  overdueText: {
    color: '#e74c3c',
  },
  
  // Empty state styles
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  
  // Loading styles
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
});