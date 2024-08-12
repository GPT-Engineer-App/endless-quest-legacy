import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"

const INITIAL_STATE = {
  resources: {
    coins: 0,
    energy: 10,
  },
  upgrades: {
    clickPower: { level: 1, cost: 10 },
    autoClicker: { level: 0, cost: 50 },
    energyRegen: { level: 1, cost: 100 },
  },
  story: {
    currentChapter: 0,
    unlockedChapters: 0,
  },
  prestige: {
    level: 0,
    multiplier: 1,
  },
};

const STORY_CHAPTERS = [
  "You start your journey as a humble coin collector.",
  "As your wealth grows, you attract the attention of local merchants.",
  "Your influence spreads, and you begin to shape the economy of your town.",
  "Your financial empire expands to neighboring cities.",
  "You become a legendary figure in the world of commerce and trade.",
];

const Index = () => {
  const [gameState, setGameState] = useState(INITIAL_STATE);
  const { toast } = useToast();

  useEffect(() => {
    const savedState = localStorage.getItem('incrementalGameState');
    if (savedState) {
      setGameState(JSON.parse(savedState));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('incrementalGameState', JSON.stringify(gameState));
  }, [gameState]);

  useEffect(() => {
    const timer = setInterval(() => {
      setGameState(prevState => ({
        ...prevState,
        resources: {
          ...prevState.resources,
          coins: prevState.resources.coins + prevState.upgrades.autoClicker.level * prevState.prestige.multiplier,
          energy: Math.min(prevState.resources.energy + prevState.upgrades.energyRegen.level * 0.1, 100),
        },
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const clickCoin = () => {
    if (gameState.resources.energy >= 1) {
      setGameState(prevState => ({
        ...prevState,
        resources: {
          ...prevState.resources,
          coins: prevState.resources.coins + prevState.upgrades.clickPower.level * prevState.prestige.multiplier,
          energy: prevState.resources.energy - 1,
        },
      }));
    } else {
      toast({
        title: "Not enough energy!",
        description: "Wait for your energy to regenerate.",
        variant: "destructive",
      });
    }
  };

  const buyUpgrade = (upgrade) => {
    if (gameState.resources.coins >= gameState.upgrades[upgrade].cost) {
      setGameState(prevState => ({
        ...prevState,
        resources: {
          ...prevState.resources,
          coins: prevState.resources.coins - prevState.upgrades[upgrade].cost,
        },
        upgrades: {
          ...prevState.upgrades,
          [upgrade]: {
            level: prevState.upgrades[upgrade].level + 1,
            cost: Math.floor(prevState.upgrades[upgrade].cost * 1.5),
          },
        },
      }));
    } else {
      toast({
        title: "Not enough coins!",
        description: "Keep collecting to afford this upgrade.",
        variant: "destructive",
      });
    }
  };

  const prestigeReset = () => {
    const newPrestigeLevel = gameState.prestige.level + 1;
    setGameState({
      ...INITIAL_STATE,
      prestige: {
        level: newPrestigeLevel,
        multiplier: 1 + newPrestigeLevel * 0.1,
      },
      story: gameState.story,
    });
    toast({
      title: "Prestige Reset!",
      description: `You've gained a ${(newPrestigeLevel * 10)}% boost to all production.`,
    });
  };

  const checkStoryProgress = () => {
    const totalUpgrades = Object.values(gameState.upgrades).reduce((sum, upgrade) => sum + upgrade.level, 0);
    const newUnlockedChapters = Math.min(Math.floor(totalUpgrades / 5), STORY_CHAPTERS.length - 1);
    
    if (newUnlockedChapters > gameState.story.unlockedChapters) {
      setGameState(prevState => ({
        ...prevState,
        story: {
          currentChapter: newUnlockedChapters,
          unlockedChapters: newUnlockedChapters,
        },
      }));
      toast({
        title: "New story chapter unlocked!",
        description: "Check the Story tab to read the latest developments.",
      });
    }
  };

  useEffect(checkStoryProgress, [gameState.upgrades]);

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <h1 className="text-4xl font-bold mb-8 text-center">Incremental Adventure</h1>
      <div className="max-w-4xl mx-auto">
        <Tabs defaultValue="game" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="game">Game</TabsTrigger>
            <TabsTrigger value="upgrades">Upgrades</TabsTrigger>
            <TabsTrigger value="story">Story</TabsTrigger>
          </TabsList>
          <TabsContent value="game">
            <Card>
              <CardHeader>
                <CardTitle>Resources</CardTitle>
                <CardDescription>Click to earn coins and manage your energy</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p>Coins: {Math.floor(gameState.resources.coins)}</p>
                    <p>Energy: {Math.floor(gameState.resources.energy)}/100</p>
                    <Progress value={gameState.resources.energy} className="mt-2" />
                  </div>
                  <Button onClick={clickCoin} disabled={gameState.resources.energy < 1}>
                    Click to earn coins (Cost: 1 energy)
                  </Button>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={prestigeReset} variant="outline">
                  Prestige Reset (Level {gameState.prestige.level})
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="upgrades">
            <Card>
              <CardHeader>
                <CardTitle>Upgrades</CardTitle>
                <CardDescription>Improve your coin production</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(gameState.upgrades).map(([key, upgrade]) => (
                    <div key={key} className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{key} (Level {upgrade.level})</p>
                        <p className="text-sm text-gray-500">Cost: {upgrade.cost} coins</p>
                      </div>
                      <Button onClick={() => buyUpgrade(key)}>Buy</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="story">
            <Card>
              <CardHeader>
                <CardTitle>Story Progress</CardTitle>
                <CardDescription>Your journey so far</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                  {STORY_CHAPTERS.slice(0, gameState.story.unlockedChapters + 1).map((chapter, index) => (
                    <p key={index} className={`mb-4 ${index === gameState.story.currentChapter ? 'font-bold' : ''}`}>
                      Chapter {index + 1}: {chapter}
                    </p>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
