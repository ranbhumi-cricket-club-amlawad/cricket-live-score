export const sampleScoreboard = {
  tournament: {
    name: "Premier Cricket Cup",
    season: "2026",
    venue: "Wankhede Stadium, Mumbai"
  },
  currentMatch: {
    status: "UPCOMING",
    matchNo: "Match 7",
    inningsNumber: 2,
    battingTeamId: "falcons",
    bowlingTeamId: "titans",
    innings: "Falcons innings",
    target: 172,
    score: {
      runs: 148,
      wickets: 4,
      overs: "17.2",
      runRate: "8.53",
      requiredRate: "7.20"
    },
    teams: {
      falcons: {
        name: "Mumbai Falcons",
        shortName: "MF",
        color: "#0f766e",
        players: ["Arjun Rao", "Karan Mehta", "Vikram Shah", "Rohan Patel", "Manav Joshi", "Dev Sharma", "Amit Yadav"]
      },
      titans: {
        name: "Delhi Titans",
        shortName: "DT",
        color: "#b45309",
        players: ["Sameer Khan", "Nikhil Verma", "Rahul Singh", "Imran Ali", "Kabir Gill", "Yash Batra", "Naveen Das"]
      }
    },
    teamScores: {
      falcons: { runs: 148, wickets: 4, overs: "17.2" },
      titans: { runs: 171, wickets: 7, overs: "20.0" }
    },
    batters: [
      {
        name: "Arjun Rao",
        role: "Striker",
        team: "Mumbai Falcons",
        runs: 62,
        balls: 38,
        fours: 7,
        sixes: 2,
        strikeRate: "163.16"
      },
      {
        name: "Karan Mehta",
        role: "Non-striker",
        team: "Mumbai Falcons",
        runs: 21,
        balls: 18,
        fours: 2,
        sixes: 0,
        strikeRate: "116.67"
      }
    ],
    battingScorecard: [
      {
        name: "Arjun Rao",
        role: "Striker",
        team: "Mumbai Falcons",
        runs: 62,
        balls: 38,
        fours: 7,
        sixes: 2,
        strikeRate: "163.16"
      },
      {
        name: "Karan Mehta",
        role: "Non-striker",
        team: "Mumbai Falcons",
        runs: 21,
        balls: 18,
        fours: 2,
        sixes: 0,
        strikeRate: "116.67"
      },
      {
        name: "Vikram Shah",
        role: "Played",
        team: "Mumbai Falcons",
        runs: 36,
        balls: 29,
        fours: 4,
        sixes: 1,
        strikeRate: "124.14"
      },
      {
        name: "Rohan Patel",
        role: "Played",
        team: "Mumbai Falcons",
        runs: 29,
        balls: 20,
        fours: 3,
        sixes: 1,
        strikeRate: "145.00"
      }
    ],
    bowler: {
      name: "Sameer Khan",
      team: "Delhi Titans",
      overs: "3.2",
      runs: 29,
      wickets: 1,
      economy: "8.70"
    },
    bowlingScorecard: [
      {
        name: "Sameer Khan",
        team: "Delhi Titans",
        overs: "3.2",
        runs: 29,
        wickets: 1,
        economy: "8.70"
      },
      {
        name: "Nikhil Verma",
        team: "Delhi Titans",
        overs: "4.0",
        runs: 34,
        wickets: 2,
        economy: "8.50"
      }
    ],
    extras: {
      wides: 0,
      noBalls: 0,
      byes: 0,
      legByes: 0,
      penalty: 0,
      total: 0
    },
    recentBalls: ["1", "4", "0", "W", "2", "1"],
    lastUpdated: new Date().toISOString()
  },
  completedMatches: [],
  upcomingMatches: [
    {
      id: "match-8",
      matchNo: "Match 8",
      date: "2026-06-01",
      time: "19:30",
      venue: "Eden Gardens, Kolkata",
      teamA: {
        name: "Kolkata Royals",
        shortName: "KR",
        players: ["Aarav Sen", "Ritwik Bose", "Sahil Dey", "Ankit Paul"]
      },
      teamB: {
        name: "Chennai Kings",
        shortName: "CK",
        players: ["Pranav Iyer", "Madhav Kumar", "Suresh Nair", "Ajay Menon"]
      }
    },
    {
      id: "match-9",
      matchNo: "Match 9",
      date: "2026-06-02",
      time: "15:30",
      venue: "M. Chinnaswamy Stadium, Bengaluru",
      teamA: {
        name: "Bengaluru Stars",
        shortName: "BS",
        players: ["Nitin Reddy", "Harish Gowda", "Charan Raj", "Kiran S"]
      },
      teamB: {
        name: "Hyderabad Hawks",
        shortName: "HH",
        players: ["Adil Khan", "Faiz Ahmed", "Ravi Teja", "Sohan R"]
      }
    },
    {
      id: "match-10",
      matchNo: "Match 10",
      date: "2026-06-03",
      time: "19:30",
      venue: "Narendra Modi Stadium, Ahmedabad",
      teamA: {
        name: "Gujarat Lions",
        shortName: "GL",
        players: ["Jay Shah", "Parth Desai", "Umang Vyas", "Dhruv Patel"]
      },
      teamB: {
        name: "Punjab Strikers",
        shortName: "PS",
        players: ["Gurpreet Singh", "Armaan Gill", "Kabir Sandhu", "Tej Brar"]
      }
    }
  ]
};
