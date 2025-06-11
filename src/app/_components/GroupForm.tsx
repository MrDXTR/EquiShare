"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

export function GroupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [people, setPeople] = useState<string[]>([""]);
  const createGroup = api.group.create.useMutation({
    onSuccess: () => {
      setName("");
      setPeople([""]);
      router.refresh();
    },
  });

  const addPerson = () => {
    setPeople([...people, ""]);
  };

  const removePerson = (index: number) => {
    setPeople(people.filter((_, i) => i !== index));
  };

  const updatePerson = (index: number, value: string) => {
    const newPeople = [...people];
    newPeople[index] = value;
    setPeople(newPeople);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validPeople = people.filter((p) => p.trim() !== "");
    if (validPeople.length === 0) return;
    createGroup.mutate({
      name,
      people: validPeople,
    });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create New Group</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="group-name" className="text-sm font-medium">
              Group Name
            </label>
            <Input
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter group name"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">People</label>
            {people.map((person, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex gap-2"
              >
                <Input
                  value={person}
                  onChange={(e) => updatePerson(index, e.target.value)}
                  placeholder={`Person ${index + 1}`}
                  required
                />
                {people.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removePerson(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </motion.div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addPerson}
              className="w-full"
            >
              Add Person
            </Button>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={createGroup.isPending}
          >
            {createGroup.isPending ? "Creating..." : "Create Group"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 