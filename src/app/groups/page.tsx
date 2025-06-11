"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Plus, Users, Receipt, ArrowRight, Calendar, X, Sparkles } from "lucide-react";
import { GroupForm } from "~/app/_components/GroupForm";

export default function GroupsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isCreating, setIsCreating] = useState(false);
  const utils = api.useUtils();
  const { data: groups } = api.group.getAll.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const handleGroupCreated = async () => {
    await utils.group.getAll.invalidate();
  };

  return (
    <div className="min-h-screen bg-gray-50/30 p-4 md:p-8">
      <div className="container mx-auto max-w-7xl space-y-8">
        
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-6"
        >
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Your Groups
            </h1>
            <p className="text-gray-600 text-lg">
              Manage your shared expenses across different groups
            </p>
          </div>
          
          <Button 
            onClick={() => setIsCreating(true)}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New Group
          </Button>
        </motion.div>

        {/* Create Group Form */}
        {isCreating && (
          <GroupForm 
            onClose={() => setIsCreating(false)} 
            onSuccess={handleGroupCreated}
          />
        )}

        {/* Groups Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {groups?.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full mb-6">
                <Users className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No groups yet</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Create your first group to start tracking shared expenses with friends, family, or roommates.
              </p>
              <Button 
                onClick={() => setIsCreating(true)}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Group
              </Button>
            </motion.div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {groups?.map((group, index) => {
                const totalExpenses = group.expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
                const recentActivity = group.expenses?.length > 0 ? 
                  new Date(group.expenses[group.expenses.length - 1]?.createdAt || new Date()).toLocaleDateString() : 
                  'No activity';

                return (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="group cursor-pointer"
                    onClick={() => router.push(`/groups/${group.id}`)}
                  >
                    <Card className="h-full bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <CardHeader className="relative pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors leading-tight">
                            {group.name}
                          </CardTitle>
                          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 duration-300" />
                        </div>
                      </CardHeader>
                      
                      <CardContent className="relative space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-gray-700">
                              {group.people.length} {group.people.length === 1 ? 'member' : 'members'}
                            </span>
                          </div>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Active
                          </Badge>
                        </div>

                        {group.expenses && group.expenses.length > 0 && (
                          <>
                            <Separator />
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Receipt className="w-4 h-4 text-green-600" />
                                  <span className="text-sm font-medium text-gray-700">
                                    {group.expenses.length} {group.expenses.length === 1 ? 'expense' : 'expenses'}
                                  </span>
                                </div>
                                <span className="font-bold text-lg text-green-600">
                                  ₹{totalExpenses.toFixed(2)}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-500">
                                  Last activity: {recentActivity}
                                </span>
                              </div>
                            </div>
                          </>
                        )}

                        {(!group.expenses || group.expenses.length === 0) && (
                          <>
                            <Separator />
                            <div className="text-center py-4">
                              <Receipt className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                              <p className="text-sm text-gray-500">No expenses yet</p>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}